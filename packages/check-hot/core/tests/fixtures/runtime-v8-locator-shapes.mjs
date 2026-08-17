export function controlledDeclaration(value) {
    return value.payload;
}

export const controlledAnonymous = function (value) {
    return value.payload;
};
export const controlledNamed = function controlledInner(value) {
    return value.payload;
};
export async function controlledAsyncDeclaration(value) {
    await Promise.resolve();
    return value.payload;
}
export function* controlledGeneratorDeclaration(value) {
    yield value.payload;
}
export async function* controlledAsyncGeneratorDeclaration(value) {
    await Promise.resolve();
    yield value.payload;
}
export const controlledAsyncExpression = async function (value) {
    await Promise.resolve();
    return value.payload;
};
export const controlledGeneratorExpression = function* (value) {
    yield value.payload;
};
export const controlledAsyncGeneratorExpression = async function* (value) {
    await Promise.resolve();
    yield value.payload;
};
export const controlledParenthesizedArrow = (value, _unused) => value.payload;
export const controlledBareArrow = value => value.payload;
export const controlledAsyncParenthesizedArrow = async (value, _unused) => {
    await Promise.resolve();
    return value.payload;
};
export const controlledAsyncBareArrow = async value => {
    await Promise.resolve();
    return value.payload;
};
export const astralMarker = "🦊",
    controlledAstral = function (value) {
        return value.payload;
    };

export const controlledObject = {
    payload: 1,
    controlledObjectMethod(value) {
        return value.payload;
    },
    get controlledObjectGetter() {
        return this.payload;
    },
    set controlledObjectSetter(value) {
        this.payload = value.payload;
    },
    async controlledObjectAsync(value) {
        await Promise.resolve();
        return value.payload;
    },
    *controlledObjectGenerator(value) {
        yield value.payload;
    },
    async *controlledObjectAsyncGenerator(value) {
        await Promise.resolve();
        yield value.payload;
    },
    ["controlledComputedObject"](value) {
        return value.payload;
    }
};

export class ControlledClass {
    payload = 1;

    controlledClassMethod(value) {
        return value.payload;
    }

    get controlledClassGetter() {
        return this.payload;
    }

    set controlledClassSetter(value) {
        this.payload = value.payload;
    }

    async controlledClassAsync(value) {
        await Promise.resolve();
        return value.payload;
    }

    *controlledClassGenerator(value) {
        yield value.payload;
    }

    async *controlledClassAsyncGenerator(value) {
        await Promise.resolve();
        yield value.payload;
    }

    ["controlledComputedClass"](value) {
        return value.payload;
    }

    static controlledStaticClass(value) {
        return value.payload;
    }
}

const value = { payload: 1 };
const instance = new ControlledClass();
for (let index = 0; index < 100; index++) {
    controlledDeclaration(value);
    controlledAnonymous(value);
    controlledNamed(value);
    void controlledAsyncDeclaration(value);
    controlledGeneratorDeclaration(value).next();
    controlledAsyncGeneratorDeclaration(value).next();
    void controlledAsyncExpression(value);
    controlledGeneratorExpression(value).next();
    controlledAsyncGeneratorExpression(value).next();
    controlledParenthesizedArrow(value);
    controlledBareArrow(value);
    void controlledAsyncParenthesizedArrow(value);
    void controlledAsyncBareArrow(value);
    controlledAstral(value);
    controlledObject.controlledObjectMethod(value);
    void controlledObject.controlledObjectGetter;
    controlledObject.controlledObjectSetter = value;
    void controlledObject.controlledObjectAsync(value);
    controlledObject.controlledObjectGenerator(value).next();
    controlledObject.controlledObjectAsyncGenerator(value).next();
    controlledObject.controlledComputedObject(value);
    instance.controlledClassMethod(value);
    void instance.controlledClassGetter;
    instance.controlledClassSetter = value;
    void instance.controlledClassAsync(value);
    instance.controlledClassGenerator(value).next();
    instance.controlledClassAsyncGenerator(value).next();
    instance.controlledComputedClass(value);
    ControlledClass.controlledStaticClass(value);
}
