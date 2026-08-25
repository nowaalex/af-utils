import { createRequire } from "node:module";
import type * as Koffi from "koffi";

const loadNativeDependency = createRequire(import.meta.url);
const koffi = loadNativeDependency("koffi") as typeof Koffi;

const PROCESS_TERMINATE = 0x0001;
const PROCESS_SET_QUOTA = 0x0100;
const JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x2000;
const JobObjectBasicAccountingInformation = 1;
const JobObjectExtendedLimitInformation = 9;

const Handle = koffi.pointer("CHECK_HOT_HANDLE", koffi.opaque());
const BasicLimitInformation = koffi.struct(
    "CHECK_HOT_JOBOBJECT_BASIC_LIMIT_INFORMATION",
    {
        PerProcessUserTimeLimit: "int64_t",
        PerJobUserTimeLimit: "int64_t",
        LimitFlags: "uint32_t",
        MinimumWorkingSetSize: "uintptr_t",
        MaximumWorkingSetSize: "uintptr_t",
        ActiveProcessLimit: "uint32_t",
        Affinity: "uintptr_t",
        PriorityClass: "uint32_t",
        SchedulingClass: "uint32_t"
    }
);
const IoCounters = koffi.struct("CHECK_HOT_IO_COUNTERS", {
    ReadOperationCount: "uint64_t",
    WriteOperationCount: "uint64_t",
    OtherOperationCount: "uint64_t",
    ReadTransferCount: "uint64_t",
    WriteTransferCount: "uint64_t",
    OtherTransferCount: "uint64_t"
});
const ExtendedLimitInformation = koffi.struct(
    "CHECK_HOT_JOBOBJECT_EXTENDED_LIMIT_INFORMATION",
    {
        BasicLimitInformation,
        IoInfo: IoCounters,
        ProcessMemoryLimit: "uintptr_t",
        JobMemoryLimit: "uintptr_t",
        PeakProcessMemoryUsed: "uintptr_t",
        PeakJobMemoryUsed: "uintptr_t"
    }
);
const BasicAccountingInformation = koffi.struct(
    "CHECK_HOT_JOBOBJECT_BASIC_ACCOUNTING_INFORMATION",
    {
        TotalUserTime: "int64_t",
        TotalKernelTime: "int64_t",
        ThisPeriodTotalUserTime: "int64_t",
        ThisPeriodTotalKernelTime: "int64_t",
        TotalPageFaultCount: "uint32_t",
        TotalProcesses: "uint32_t",
        ActiveProcesses: "uint32_t",
        TotalTerminatedProcesses: "uint32_t"
    }
);

const kernel32 = koffi.load("kernel32.dll");
const createJobObject = kernel32.func("__stdcall", "CreateJobObjectW", Handle, [
    "void *",
    "void *"
]);
const setInformationJobObject = kernel32.func(
    "__stdcall",
    "SetInformationJobObject",
    "int",
    [Handle, "int", koffi.pointer(ExtendedLimitInformation), "uint32_t"]
);
const openProcess = kernel32.func("__stdcall", "OpenProcess", Handle, [
    "uint32_t",
    "int",
    "uint32_t"
]);
const assignProcessToJobObject = kernel32.func(
    "__stdcall",
    "AssignProcessToJobObject",
    "int",
    [Handle, Handle]
);
const terminateJobObject = kernel32.func(
    "__stdcall",
    "TerminateJobObject",
    "int",
    [Handle, "uint32_t"]
);
const queryInformationJobObject = kernel32.func(
    "__stdcall",
    "QueryInformationJobObject",
    "int",
    [
        Handle,
        "int",
        koffi.out(koffi.pointer(BasicAccountingInformation)),
        "uint32_t",
        "void *"
    ]
);
const closeHandle = kernel32.func("__stdcall", "CloseHandle", "int", [Handle]);
const getLastError = kernel32.func("__stdcall", "GetLastError", "uint32_t", []);

const win32Error = (operation: string) =>
    new Error(`${operation} failed with Win32 error ${getLastError()}`);

/** Windows Job Object containing one wrapper and every process it creates. */
export interface WindowsProcessJob {
    /** Assign a suspended-by-protocol wrapper before it may create descendants. */
    assign(pid: number): void;
    /** Terminate every process still contained by the job. */
    terminate(): void;
    /** Return the number of processes whose termination has not completed. */
    activeProcessCount(): number;
    /** Close the owning handle and activate kill-on-close as a final safeguard. */
    close(): void;
}

/** Create a non-breakaway Job Object whose handle owns the complete worker tree. */
export const createWindowsProcessJob = (): WindowsProcessJob => {
    const job = createJobObject(null, null);
    if (!job) throw win32Error("CreateJobObjectW");
    const limits = {
        BasicLimitInformation: {
            PerProcessUserTimeLimit: 0,
            PerJobUserTimeLimit: 0,
            LimitFlags: JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE,
            MinimumWorkingSetSize: 0,
            MaximumWorkingSetSize: 0,
            ActiveProcessLimit: 0,
            Affinity: 0,
            PriorityClass: 0,
            SchedulingClass: 0
        },
        IoInfo: {
            ReadOperationCount: 0,
            WriteOperationCount: 0,
            OtherOperationCount: 0,
            ReadTransferCount: 0,
            WriteTransferCount: 0,
            OtherTransferCount: 0
        },
        ProcessMemoryLimit: 0,
        JobMemoryLimit: 0,
        PeakProcessMemoryUsed: 0,
        PeakJobMemoryUsed: 0
    };
    if (
        !setInformationJobObject(
            job,
            JobObjectExtendedLimitInformation,
            limits,
            koffi.sizeof(ExtendedLimitInformation)
        )
    ) {
        const error = win32Error("SetInformationJobObject");
        closeHandle(job);
        throw error;
    }

    let closed = false;
    return {
        assign(pid) {
            const processHandle = openProcess(
                PROCESS_TERMINATE | PROCESS_SET_QUOTA,
                0,
                pid
            );
            if (!processHandle) throw win32Error(`OpenProcess(${pid})`);
            try {
                if (!assignProcessToJobObject(job, processHandle)) {
                    throw win32Error(`AssignProcessToJobObject(${pid})`);
                }
            } finally {
                closeHandle(processHandle);
            }
        },
        terminate() {
            if (!closed && !terminateJobObject(job, 1)) {
                throw win32Error("TerminateJobObject");
            }
        },
        activeProcessCount() {
            const accounting = {};
            if (
                !queryInformationJobObject(
                    job,
                    JobObjectBasicAccountingInformation,
                    accounting,
                    koffi.sizeof(BasicAccountingInformation),
                    null
                )
            ) {
                throw win32Error("QueryInformationJobObject");
            }
            return (accounting as { ActiveProcesses: number }).ActiveProcesses;
        },
        close() {
            if (closed) return;
            closed = true;
            if (!closeHandle(job)) throw win32Error("CloseHandle(job)");
        }
    };
};
