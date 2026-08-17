import type { HotRecipeResolver } from "./shared.js";
import { createRecipeTestRunner, testRunnerVersion } from "./shared.js";
import type { HotModuleMutationInputContext } from "@af-utils/check-hot";

/** date-fns peer range covered by this adapter. */
export const dateFnsPackageRange = ">=3 <5";

const firstDate = () => new Date("2020-06-15T12:30:00.000Z");
const secondDate = () => new Date("2020-06-17T12:30:00.000Z");

const verifyDate = (result: unknown) => {
    if (!(result instanceof Date) || Number.isNaN(result.getTime())) {
        throw new TypeError("date-fns recipe must return a valid Date");
    }
};

const verifyDateObject = (result: unknown) => {
    if (!(result instanceof Date)) {
        throw new TypeError("date-fns arithmetic recipe must return a Date");
    }
};

type DateArithmeticUnit = "day" | "hour" | "minute" | "month" | "week" | "year";

interface DateArithmeticOperation {
    direction: 1 | -1;
    unit: DateArithmeticUnit;
}

const dateArithmeticOperation = (
    normalizedName: string
): DateArithmeticOperation | undefined => {
    const match =
        /^(add|sub)(day|days|hour|hours|minute|minutes|month|months|week|weeks|year|years)$/u.exec(
            normalizedName
        );
    if (!match) return;
    const unit = match[2].replace(/s$/u, "") as DateArithmeticUnit;
    return { direction: match[1] === "add" ? 1 : -1, unit };
};

const addExpectedMonths = (date: Date, amount: number) => {
    const expected = new Date(date.getTime());
    if (Number.isNaN(amount)) return new Date(Number.NaN);
    if (!amount) return expected;
    const dayOfMonth = expected.getDate();
    const endOfDesiredMonth = new Date(expected.getTime());
    endOfDesiredMonth.setMonth(expected.getMonth() + amount + 1, 0);
    const daysInMonth = endOfDesiredMonth.getDate();
    if (dayOfMonth >= daysInMonth) return endOfDesiredMonth;
    expected.setFullYear(
        endOfDesiredMonth.getFullYear(),
        endOfDesiredMonth.getMonth(),
        dayOfMonth
    );
    return expected;
};

const expectedDateArithmetic = (
    date: Date,
    amount: number,
    operation: DateArithmeticOperation
) => {
    const signedAmount = amount * operation.direction;
    if (operation.unit === "month") {
        return addExpectedMonths(date, signedAmount);
    }
    if (operation.unit === "year") {
        return addExpectedMonths(date, signedAmount * 12);
    }
    const expected = new Date(date.getTime());
    if (operation.unit === "day" || operation.unit === "week") {
        if (Number.isNaN(signedAmount)) return new Date(Number.NaN);
        if (!signedAmount) return expected;
        expected.setDate(
            expected.getDate() +
                signedAmount * (operation.unit === "week" ? 7 : 1)
        );
        return expected;
    }
    const milliseconds = operation.unit === "hour" ? 3_600_000 : 60_000;
    expected.setTime(expected.getTime() + signedAmount * milliseconds);
    return expected;
};

const verifyDateArithmetic =
    (operation: DateArithmeticOperation) =>
    (context: { args: readonly unknown[]; result: unknown }) => {
        const [date, amount] = context.args;
        verifyDateObject(context.result);
        if (!(date instanceof Date) || typeof amount !== "number") {
            throw new TypeError(
                "date-fns arithmetic mutation has invalid inputs"
            );
        }
        const expected = expectedDateArithmetic(date, amount, operation);
        const actualTime = (context.result as Date).getTime();
        const expectedTime = expected.getTime();
        if (
            !(Number.isNaN(actualTime) && Number.isNaN(expectedTime)) &&
            actualTime !== expectedTime
        ) {
            throw new TypeError(
                `date-fns arithmetic returned ${actualTime}, expected ${expectedTime}`
            );
        }
    };

const verifyNumber = (result: unknown) => {
    if (typeof result !== "number" || !Number.isFinite(result)) {
        throw new TypeError("date-fns recipe must return a finite number");
    }
};

const acceptDateArithmeticMutation = ({
    mutationFamily,
    variant
}: HotModuleMutationInputContext) =>
    mutationFamily === "numeric-representation" &&
    (variant === "negative-zero" || variant === "nan")
        ? "this arithmetic-site recipe excludes values that intentionally return before the date arithmetic operation"
        : true;

const resolveDateFnsRecipes: HotRecipeResolver = candidate => {
    const normalized = candidate.name.toLowerCase();
    if (/parseiso/u.test(normalized)) {
        return [
            {
                label: "iso-date",
                args: () => ["2020-06-15T12:30:00.000Z"],
                verify: verifyDate
            }
        ];
    }
    if (/format/u.test(normalized)) {
        return [
            {
                label: "date-format",
                args: () => [firstDate(), "yyyy-MM-dd"],
                verify(result) {
                    if (result !== "2020-06-15") {
                        throw new TypeError(
                            "date-fns format recipe returned unexpected text"
                        );
                    }
                }
            }
        ];
    }
    if (/^is(?:after|before|equal|same)/u.test(normalized)) {
        return [
            {
                label: "date-pair",
                args: () => [secondDate(), firstDate()],
                verify(result) {
                    if (typeof result !== "boolean") {
                        throw new TypeError(
                            "date-fns predicate recipe must return a boolean"
                        );
                    }
                }
            }
        ];
    }
    const arithmeticOperation = dateArithmeticOperation(normalized);
    if (arithmeticOperation) {
        return [
            {
                label: "date-and-amount",
                args: iteration => [
                    firstDate(),
                    iteration % 2 === 0 ? 2 : 2.5,
                    { in: undefined, scenario: "check-hot" }
                ],
                verify: verifyDateObject,
                acceptMutation: acceptDateArithmeticMutation,
                verifyMutation: verifyDateArithmetic(arithmeticOperation)
            },
            {
                label: "date-invalid-amount-branch",
                args: () => [
                    firstDate(),
                    Number.NaN,
                    { in: undefined, scenario: "check-hot-invalid" }
                ],
                verify: verifyDateObject,
                acceptMutation: acceptDateArithmeticMutation,
                verifyMutation: verifyDateArithmetic(arithmeticOperation)
            }
        ];
    }
    if (normalized.startsWith("difference")) {
        return [
            {
                label: "date-difference",
                args: () => [secondDate(), firstDate()],
                verify: verifyNumber
            }
        ];
    }
    if (/^(?:startof|endof)/u.test(normalized)) {
        return [
            {
                label: "valid-date",
                args: () => [firstDate()],
                verify: verifyDate
            }
        ];
    }
    return [];
};

/** Date recipes declared compatible with the selected date-fns releases. */
const dateFnsTestRunner = createRecipeTestRunner({
    id: "date-fns-public-api",
    version: testRunnerVersion,
    packageNames: ["date-fns"],
    packageRange: dateFnsPackageRange,
    resolve: resolveDateFnsRecipes
});

export default dateFnsTestRunner;
