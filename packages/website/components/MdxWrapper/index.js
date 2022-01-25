const MdxWrapper = ({ children }) => (
    <div className="overflow-auto w-full">
        <div className="prose md:prose-lg max-w-[60em] pt-4">
            {children}
        </div>
    </div>
);

export default MdxWrapper;