globalThis.Functions = {
    Report: (Text, Image) => {
        new Notification({
            Text: Text,
            Image: Image,
        }).Append();

        HideDropdown();
    },
    SetHeader: async () => {
        let Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/kumchat/deployments`;
        let Headers = { Authorization: `token ${GithubStorageConfig.Token}` };

        let Response = await fetch(Url, { headers: Headers });
        let Deployments = await Response.json();

        Header.innerHTML = `kumchat v${Deployments.length / 10}`;

        if (!localStorage.getItem("Update")) localStorage.setItem("Update", `kv${Deployments.length / 10}`);
        else {
            const Local = parseFloat(localStorage.getItem("Update").replace("kv", ""));
            if (Local !== Deployments.length / 10) {
                new Notification({
                    Text: `Kumchat is now updated to <i>kv${Deployments.length / 10}</i>, replacing <i>kv${Local}</i>.`,
                    Image: "../images/Update.svg"
                }, undefined, 7500).Append();
                localStorage.setItem("Update", `kv${Deployments.length / 10}`);
            }
        }
    }
};