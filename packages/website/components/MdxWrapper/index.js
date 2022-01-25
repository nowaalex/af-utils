const MdxWrapper = ({ children }) => (
    <div className="overflow-auto w-full">
        <div className="mdx-wrapper max-w-[60em]">
            {children}
        </div>
    </div>
);

export default MdxWrapper;