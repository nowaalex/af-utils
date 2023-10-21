const docHref = (packageName: string, param: string, hash?: string) =>
    "/virtual/reference/" +
    packageName +
    "." +
    param.toLowerCase() +
    ".md" +
    (hash ? "#" + hash : "");

export default docHref;
