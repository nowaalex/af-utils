import css from "./style.module.scss";

const Playground = ({ example }) => {
    
    const { default: Component } = example;

    return (
        <div className={css.wrapper}>
            <Component />
        </div>
    );
}

export default Playground;