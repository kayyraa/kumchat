const User = localStorage.getItem("User") ? JSON.parse(localStorage.getItem("User")) : [];

NewChatButton.addEventListener("click", async () => {
    const PromptDiv = new Prompt({ Title: "New DM", Nodes: [] }, [".Content", {
        width: "100%",
        alignItems: "center"
    }]).Append();
    PromptDiv.querySelector(".Content").innerHTML = `
        <span style="width: calc(100% - 1em);">Users</span>
        <input class="UserInput" style="width: calc(100% - 2em); margin-right: 1em;" type="text" placeholder="Users, format: x, x, x">
        <span style="width: calc(100% - 1em);">Icon (optional)</span>
        <input class="IconInput" style="width: calc(100% - 1em);" type="file" accept="image/*">
        <button class="CreateButton" style="width: calc(100% - 2em); margin-right: 1em;">Create</button>
    `;

    let Icon;
    PromptDiv.querySelector(".Content").querySelector(".IconInput").addEventListener("change", async () => {
        const UploadedFile = PromptDiv.querySelector(".Content").querySelector(".IconInput").files[0];
        if (!UploadedFile) return;
        
        const Path = `kumchat/${Uuid(8)}.${UploadedFile.name.split(".")[1]}`;
        await new GithubStorage(UploadedFile).Upload(Path);
        Icon = `https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true`;
    });

    PromptDiv.querySelector(".Content").querySelector(".CreateButton").addEventListener("click", async () => {
        const Users = PromptDiv.querySelector(".Content").querySelector(".UserInput").value.split(",").map((String) => String.trim());
        if (Users.length === 0) return;

        const Document = {
            Users: Users,
            Icon: Icon || `../images/Group${Math.floor(Math.random() * 3)}.svg`,
            Messages: []
        };

        await new FireStorage("DMs").AppendDocument(Document);
        location.reload();
    });
});

const SwitchFrame = (TargetFrame) => {
    MoreButton.backgroundColor = "red";
    MoreButton.backgroundColor = "";
    Frames.forEach((Frame, Index) => {
        Frame.style.left = Index === 0 ? "-125%" : "125%";
        Frame.style.pointerEvents = "none";
        if (Frame.getAttribute("href") !== TargetFrame) return;
        Frame.style.left = "0%";
        Frame.style.pointerEvents = "auto";
    });
};

let SelectedChats = [];
let Selecting = false;
MoreButton.addEventListener("click", (Event) => {
    Dropdown.innerHTML = `
        <div style="background-color: ${Selecting ? "rgba(255, 255, 255, 0.125)" : ""};" class="SelectChatsButton">
            <span>Select chats</span>
            <img src="../images/CheckStroke.svg">
        </div>
        <div class="DeleteSelectedButton">
            <span>Delete selected</span>
            <img src="../images/Trash.svg">
        </div>
    `;

    Dropdown.style.left = `${Event.clientX + Dropdown.clientWidth / 2}px`;
    Dropdown.style.top = `${Event.clientY + Dropdown.clientHeight - 32}px`;
    Dropdown.style.opacity = "1";
    Dropdown.style.pointerEvents = "auto";

    requestAnimationFrame(() => {
        const SelectChatsButton = Dropdown.querySelector(".SelectChatsButton");
        const DeleteSelectedButton = Dropdown.querySelector(".DeleteSelectedButton");

        SelectChatsButton.addEventListener("click", () => {
            Selecting = !Selecting;
            SelectedChats = [];

            Array.from(Chatlist.children).forEach(ChatNode => {
                const ChatId = ChatNode.getAttribute("id");

                ChatNode.setAttribute("selected", "false");
                ChatNode.addEventListener("click", () => {
                    const IsSelected = ChatNode.getAttribute("selected") === "true";
                    ChatNode.setAttribute("selected", IsSelected ? "false" : "true");
                    ChatNode.style.backgroundColor = IsSelected ? "" : "rgba(120, 120, 255, 0.25)";

                    if (!IsSelected) SelectedChats.push(ChatId);
                    else SelectedChats = SelectedChats.filter((String) => String !== ChatId);
                });
            });

            Dropdown.style.opacity = "0";
            Dropdown.style.pointerEvents = "none";
        });

        DeleteSelectedButton.addEventListener("click", async () => {
            if (SelectedChats.length === 0) return;
            for (const Chat of SelectedChats) {
                const ChatDocument = await new FireStorage("DMs").GetDocument(Chat);
                const Members = ChatDocument.Users || [];
                const UpdatedMembers = Members.filter((Member) => Member !== User.Username);
                await new FireStorage("DMs").UpdateDocument(Chat, { Users: UpdatedMembers });
            }
            location.reload();
        });
    });
});

document.addEventListener("mousedown", (Event) => {
    if (Event.target === MoreButton || Event.target === Dropdown || Event.target.offsetParent === Dropdown) return;
    Dropdown.style.opacity = "0";
    Dropdown.style.pointerEvents = "none";
});

UploadMediaButton.addEventListener("click", () => {
    const PromptDiv = new Prompt({ Title: "Upload Media", Nodes: [] }, [".Content", {
        width: "100%",
        alignItems: "center"
    }]).Append();
    PromptDiv.querySelector(".Content").innerHTML = `
        <span style="width: calc(100% - 1em);">File input</span>
        <input class="FileInput" style="width: calc(100% - 1em);" type="file" accept="image/*">
        <button class="UploadButton" style="width: calc(100% - 2em); margin-right: 1em;">Upload</button>
    `;

    let File;
    PromptDiv.querySelector(".Content").querySelector(".FileInput").addEventListener("change", async () => {
        File = PromptDiv.querySelector(".Content").querySelector(".FileInput").files[0];
    });

    PromptDiv.querySelector(".Content").querySelector(".UploadButton").addEventListener("click", async () => {
        if (!File) return;

        const Path = `kumchat/${Uuid(8)}.${File.name.split(".")[1]}`;
        await new GithubStorage(File).Upload(Path);
        await CopyToClipboard(String(`https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true`));

        PromptDiv.querySelector(".Content").innerHTML += "<span>File uploaded successfully, copied to clipboard.</span>";
    });
});

const FetchDMs = async () => {
    if (!User) return;

    let Fetched = false;
    const Documents = await new FireStorage("DMs").GetDocuments();
    Documents.forEach((Document) => {
        if (!Document.Users.includes(User.Username)) return;
        const IsGroup = Document.Users.length > 2;

        const Node = document.createElement("div");
        Node.innerHTML = `
            <img src="${Document.Icon}">
            <div>
                <span>${IsGroup ? Document.Users.filter((String) => String !== User.Username).join(", ") : Document.Users.find((String) => String !== User.Username)}</span>
                <span>${Document.Messages.length > 0 ? new Format(Document.Messages[Document.Messages.length - 1].Timestamp).ConvertEpochToReadable("hh:mm") : ""}</span>
                <span>${Document.Messages.length > 0 ? TruncateString(`${Document.Messages[Document.Messages.length - 1].Author === User.Username ? "You" : Document.Messages[Document.Messages.length - 1].Author}: ${Document.Messages[Document.Messages.length - 1].Content}`, 24, "...") : ""}</span>
            </div>
        `;
        Node.setAttribute("id", Document.id);
        Node.style.order = `-${Document.Messages.length > 0 ? Document.Messages[Document.Messages.length - 1].Timestamp : ""}`;
        Chatlist.appendChild(Node);

        Node.addEventListener("click", () => {
            if (Selecting) return;
            SwitchFrame("Chat");

            Chat.querySelector(".Topbar .DMIcon").src = Document.Icon;
            Chat.querySelector(".Topbar .DMName").innerHTML = IsGroup ? Document.Users.filter((String) => String !== User.Username).join(", ") : Document.Users.find((String) => String !== User.Username);
            
            Chat.querySelector(".Topbar .BackButton").addEventListener("click", () => SwitchFrame("Chats"));

            function UpdateMessages() {
                Chat.querySelector(".Messages").innerHTML = "";
                Document.Messages.forEach(async Message => {
                    const AuthorDocuments = await new FireStorage("Users").GetDocumentsByField("Username", Message.Author);
                    const AuthorDocument = AuthorDocuments[0];

                    const MessageNode = document.createElement("div");
                    MessageNode.style.order = Message.Timestamp;
                    MessageNode.innerHTML = `
                        <span>${Message.Content}</span>
                        <img src="${AuthorDocument.ProfileImage}">
                    `;
                    if (Message.Author === User.Username) MessageNode.setAttribute("client", "");
                    Chat.querySelector(".Messages").appendChild(MessageNode);

                    if (Message.Author === User.Username) {
                        Dropdown.innerHTML = `<div class="DeleteButton">Delete</div>`;
                        MessageNode.ClickAndHold((Event) => {
                            Dropdown.style.opacity = "1";
                            Dropdown.style.pointerEvents = "auto";
                            Dropdown.style.left = `${Event.clientX - Dropdown.clientWidth / 2}px`;
                            Dropdown.style.top = `${Event.clientY + Dropdown.clientHeight}px`;
                        }, 750);

                        Dropdown.querySelector(".DeleteButton").addEventListener("click", async () => {
                            const MessageIndex = Document.Messages.findIndex(MessageItem => 
                                MessageItem.Author === Message.Author && 
                                MessageItem.Content === Message.Content && 
                                MessageItem.Timestamp === Message.Timestamp
                            );
                        
                            if (MessageIndex === -1) return;
                            const NewMessages = [...Document.Messages];
                            NewMessages.splice(MessageIndex, 1);
                        
                            await new FireStorage("DMs").UpdateDocument(Document.id, { Messages: NewMessages });
                            requestAnimationFrame(UpdateMessages);
                            Document.Messages = NewMessages;
                        
                            Dropdown.style.opacity = "0";
                            Dropdown.style.pointerEvents = "none";
                        });                            
                    }
                });
            }

            async function SendMessage() {
                const Input = Chat.querySelector(".Input input");
                const Message = Input.value;
                if (!Message) return;

                const NewMessage = {
                    Author: User.Username,
                    Content: Message,
                    Timestamp: Math.floor(Date.now() / 1000),
                };

                const NewMessages = [...Document.Messages, NewMessage];
                await new FireStorage("DMs").UpdateDocument(Document.id, { Messages: NewMessages });
                requestAnimationFrame(UpdateMessages);
                Document.Messages = NewMessages;

                Input.value = "";
            }

            Chat.querySelector(".Input .SendButton").addEventListener("click", SendMessage);
            Chat.querySelector(".Input input").addEventListener("keydown", (Event) => {
                if (Event.key === "Enter") SendMessage();
            });

            UpdateMessages();
        });
    });

    Fetched = true;
    let FirstSnapshot = true;

    if (Fetched) {
        new FireStorage("DMs").OnSnapshot((Snapshot) => {
            if (FirstSnapshot) {
                FirstSnapshot = false;
                return;
            }
            Snapshot.docs.forEach((Document) => {
                Chat.querySelector(".Messages").innerHTML = "";
                Document.data().Messages.forEach(async Message => {
                    const AuthorDocuments = await new FireStorage("Users").GetDocumentsByField("Username", Message.Author);
                    const AuthorDocument = AuthorDocuments[0];

                    const MessageNode = document.createElement("div");
                    MessageNode.style.order = Message.Timestamp;
                    MessageNode.innerHTML = `
                        <span>${Message.Content}</span>
                        <img src="${AuthorDocument.ProfileImage}">
                    `;
                    if (Message.Author === User.Username) MessageNode.setAttribute("client", "");
                    Chat.querySelector(".Messages").appendChild(MessageNode);

                    if (Message.Author === User.Username) {
                        Dropdown.innerHTML = `<div class="DeleteButton">Delete</div>`;
                        MessageNode.ClickAndHold((Event) => {
                            Dropdown.style.opacity = "1";
                            Dropdown.style.pointerEvents = "auto";
                            Dropdown.style.left = `${Event.clientX - Dropdown.clientWidth / 2}px`;
                            Dropdown.style.top = `${Event.clientY + Dropdown.clientHeight}px`;
                        }, 750);

                        Dropdown.querySelector(".DeleteButton").addEventListener("click", async () => {
                            const MessageIndex = Document.data().Messages.findIndex(MessageItem => 
                                MessageItem.Author === Message.Author && 
                                MessageItem.Content === Message.Content && 
                                MessageItem.Timestamp === Message.Timestamp
                            );
                        
                            if (MessageIndex === -1) return;
                            const NewMessages = [...Document.data().Messages];
                            NewMessages.splice(MessageIndex, 1);
                        
                            await new FireStorage("DMs").UpdateDocument(Document.data().id, { Messages: NewMessages });
                            requestAnimationFrame(UpdateMessages);
                            Document.data().Messages = NewMessages;
                        
                            Dropdown.style.opacity = "0";
                            Dropdown.style.pointerEvents = "none";
                        });
                    }
                });
            });
        });
    }
};

document.addEventListener("DOMContentLoaded", FetchDMs);
document.addEventListener("DOMContentLoaded", () => SwitchFrame("Chats"));