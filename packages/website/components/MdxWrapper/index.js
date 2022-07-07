const MdxWrapper = ({ children }) => (
    <div className="overflow-auto px-8 pt-4 w-full h-full">
        <div className="prose max-w-[1200px] w-full">{children}</div>
    </div>
);

export default MdxWrapper;
