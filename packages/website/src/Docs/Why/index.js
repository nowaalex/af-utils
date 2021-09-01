const Why = () => {
    return (
        <div>
            <h2>What is it?</h2>
            <p>
                When you need to render a list/table with a lot of rows, you may face performance problems.
                A lot of DOM nodes must be allocated and updated(if needed), but only a few of them are visible.
            </p>
            <p>
                One way to optimize this is called virtualization. Based on scrollTop and height of each row we may calculate,
                what range must be rendered now.
            </p>
            <h2>Approximate scheme</h2>
            <pre>
				|&uarr;|----------------------------------{"\n"}
                |S| ARTIFICIAL OFFSET                {"\n"}
                |C|----------------------------------{"\n"}
                |R| visible rows, which are rendered {"\n"}
                |O| &mdash;{"\n"}
                |L| &mdash;{"\n"}
                |L| &mdash;{"\n"}
                |B| &mdash;{"\n"}
                |A|----------------------------------{"\n"}
                |R| ARTIFICIAL OFFSET                {"\n"}
                |&darr;|----------------------------------{"\n"}
            </pre>
        </div>
    );
}

export default Why;