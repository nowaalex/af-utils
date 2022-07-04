const MdxWrapper = ({ children }) => (
    <div className="overflow-auto w-full px-6">
        <div className="prose prose-neutral max-w-[80em] pt-4">{children}</div>
    </div>
);

export default MdxWrapper;
