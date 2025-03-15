const Storage = new FireStorage("Users");
AccountButton.addEventListener("click", async () => {
    const UsernameInput = document.createElement("input");
    UsernameInput.placeholder = "Username";
    UsernameInput.type = "text";
    UsernameInput.value = localStorage.getItem("User") ? JSON.parse(localStorage.getItem("User")).Username : "";

    const PasswordInput = document.createElement("input");
    PasswordInput.placeholder = "Password";
    PasswordInput.type = "text";

    const Submit = document.createElement("button");
    Submit.textContent = "Submit";

    const LogOut = document.createElement("button");
    LogOut.textContent = "Log Out";
    LogOut.style.backgroundColor = "rgb(200, 0, 0)";
    LogOut.style.display = localStorage.getItem("User") ? "" : "none";

    new Prompt({
        Title: "Account",
        Nodes: [UsernameInput, PasswordInput, Submit, LogOut]
    }, [".Content", {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",

        justifyContent: "center",

        margin: "0",

        width: "calc(100% - 2em)",
        height: "calc(100% - 2em)"
    }]).Append();

    LogOut.addEventListener("click", () => {
        localStorage.removeItem("User");
        location.reload();
    });

    Submit.addEventListener("click", async () => {
        const Username = UsernameInput.value.trim();
        const Password = PasswordInput.value.trim();
        if (!Username || !Password) return;

        const User = { Username, Password };

        const Documents = await Storage.GetDocumentsByField("Username", User.Username);
        if (Documents.length > 0) {
            if (Documents[0].Password === Password) {
                localStorage.setItem("User", JSON.stringify(User));
                location.reload();
            }
        } else {
            await Storage.AppendDocument(User);
            localStorage.setItem("User", JSON.stringify(User));
            location.reload();
        }
    });
});