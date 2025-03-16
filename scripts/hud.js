const User = localStorage.getItem("User") ? JSON.parse(localStorage.getItem("User")) : [];

NewChatButton.addEventListener("click", async () => {
    const PromptDiv = new Prompt({ Title: "New DM", Nodes: [] }, [".Content", {
        width: "100%",
        alignItems: "center"
    }]).Append();
    PromptDiv.querySelector(".Content").innerHTML = `
        <span style="width: calc(100% - 1em);">Members</span>
        <input class="UserInput" style="width: calc(100% - 2em); margin-right: 1em;" type="text" placeholder="x, x, x ...">
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

    PromptDiv.style.minHeight = "calc(12em + 8px)";
    PromptDiv.style.maxHeight = "calc(12em + 8px)";
});

const SwitchFrame = (TargetFrame) => {
    MoreButton.backgroundColor = "red";
    MoreButton.backgroundColor = "";
    Frames.forEach((Frame, Index) => {
        if (Frame.getAttribute("href") !== TargetFrame) {
            Frame.style.left = `${Index < Frames.findIndex(Frame => Frame.getAttribute("href") === TargetFrame) ? "-125%" : "125%"}`;
            Frame.style.pointerEvents = "none";
        } else {
            Frame.style.left = "0%";
            Frame.style.pointerEvents = "auto";
        }
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
            <span>Delete / leave selected</span>
            <img src="../images/Trash.svg">
        </div>
    `;

    MoveDropdown(Event.clientX, Event.clientY);
    ShowDropdown();

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
                    ChatNode.style.backgroundColor = IsSelected ? "" : "rgba(120, 160, 255, 0.5)";

                    if (!IsSelected) SelectedChats.push(ChatId);
                    else SelectedChats = SelectedChats.filter((String) => String !== ChatId);
                });
            });

            HideDropdown();
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
    HideDropdown();
});

UploadMediaButton.addEventListener("click", () => {
    const PromptDiv = new Prompt({ Title: "Upload Media", Nodes: [] }, [".Content", {
        width: "100%",
        alignItems: "center"
    }]).Append();
    PromptDiv.style.minHeight = "calc(12em + 8px)";
    PromptDiv.style.maxHeight = "calc(12em + 8px)";
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

Search.querySelector("input").addEventListener("input", async () => {
    const SearchQuery = Search.querySelector("input").value.trim().toLowerCase();

    if (!SearchQuery) {
        Array.from(Chatlist.children).forEach(Child => Child.style.display = "");
        return;
    }

    Array.from(Chatlist.children).forEach(Child => {
        const Name = Child.querySelector("div").querySelector("span:first-child").textContent.toLowerCase();
        Child.style.display = Name.includes(SearchQuery) ? "" : "none";
    });
});

const FetchDMs = async () => {
    if (!User) return;

    let Fetched = false;
    const Documents = await new FireStorage("DMs").GetDocuments();
    Documents.forEach(async (Document) => {
        if (!Document.Users.includes(User.Username)) return;
        const IsGroup = Document.Users.length > 2;

        let Icon;
        if (IsGroup) Icon = Document.Icon;
        else {
            const OtherDocuments = await new FireStorage("Users").GetDocumentsByField("Username", Document.Users.filter((String) => String !== User.Username)[0]);
            const OtherDocument = OtherDocuments[0];
            Icon = OtherDocument.ProfileImage;
        }

        let Name = Document.Name || (IsGroup ?
            Document.Users.filter((String) => String !== User.Username).join(", ") :
            Document.Users.find((String) => String !== User.Username));

        const Node = document.createElement("div");
        Node.innerHTML = `
            <img src="${Icon}">
            <div>
                <span>${Name}</span>
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

            Chat.querySelector(".Topbar .DMIcon").src = Icon;
            Chat.querySelector(".Topbar .DMName").innerHTML = Name;

            Chat.querySelector(".Topbar .BackButton").addEventListener("click", () => SwitchFrame("Chats"));

            function UpdateMessages() {
                let Authors = [];
                let UsedColors = new Set();
                let LastAuthor = null;
                let StreakStartNode = null;

                Chat.querySelector(".Messages").innerHTML = "";
                Document.Messages.forEach(async (Message, Index, Messages) => {
                    const IsAuthor = Message.Author === User.Username;

                    const AuthorDocuments = await new FireStorage("Users").GetDocumentsByField("Username", Message.Author);
                    const AuthorDocument = AuthorDocuments[0];

                    let AuthorEntry = Authors.find((Author) => Author.Author === Message.Author);
                    if (!AuthorEntry) {
                        let AvailableColors = Palette.Neon.filter(Color => !UsedColors.has(Color));
                        let AssignedColor = AvailableColors.length ? AvailableColors[Math.floor(Math.random() * AvailableColors.length)] : Palette.Neon[Math.floor(Math.random() * Palette.Neon.length)];
                        UsedColors.add(AssignedColor);
                        AuthorEntry = { Author: Message.Author, Color: AssignedColor };
                        Authors.push(AuthorEntry);
                    }

                    let MessageContent = "";
                    Message.Content.split(" ").forEach(Word => {
                        let Tag = "/span";
                        let Attribute = "";
                        let Content = Word;

                        if (Word.startsWith("<audio>")) {
                            Tag = "/div";
                            Content = "";
                            Attribute = ` class="Attachment" src="${Word.replace("<audio>", "").replace("</audio>", "")}" type="Audio"`;
                        }

                        MessageContent += `<${Tag.replace("/", "")}${Attribute}>${Content}<${Tag}>`;
                    });

                    const MessageNode = document.createElement("div");
                    MessageNode.style.order = Message.Timestamp;
                    MessageNode.innerHTML = `
                        <span style="--Color: ${AuthorEntry.Color};">${Message.Author}</span>
                        <span>${MessageContent}</span>
                        <span>${new Format(Message.Timestamp).ConvertEpochToReadable("hh:mm")}</span>
                        <img src="${AuthorDocument.ProfileImage}">
                    `;

                    if (IsAuthor) MessageNode.setAttribute("client", "");
                    Chat.querySelector(".Messages").appendChild(MessageNode);

                    if (LastAuthor !== Message.Author) StreakStartNode = MessageNode;
                    else StreakStartNode.querySelector("img:not(.PlayButton)")?.remove();

                    StreakStartNode = MessageNode;
                    LastAuthor = Message.Author;

                    MessageNode.ClickAndHold((Event) => {
                        ShowDropdown();
                        MoveDropdown(Event.clientX, Event.clientY, IsAuthor);

                        if (IsAuthor) {
                            Dropdown.innerHTML = `<div class="DeleteButton">Delete</div>`;

                            requestAnimationFrame(() => {
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
                                    Document.Messages = NewMessages;
                                    requestAnimationFrame(UpdateMessages);
        
                                    HideDropdown();
                                });
                            });
                        } else {
                            Dropdown.innerHTML = `
                            <div class="ReportButton">
                                <span>Report (i dont give af)</span>
                                <img src="../images/Flag.svg">
                            </div>`;

                            requestAnimationFrame(() => {
                                Dropdown.querySelector(".ReportButton").addEventListener("click", () => {
                                    Functions.Report(`Reported: ${MessageNode.querySelector("span:nth-child(1)").textContent}: ${TruncateString(MessageNode.querySelector("span:nth-child(2)").textContent, 16, "...")}`, "../images/Flag.svg")
                                });
                            });
                        }
                    }, 750);

                    Chat.querySelector(".Messages").querySelectorAll(".Attachment").forEach(Attachment => {
                        const Type = Attachment.getAttribute("Type");
                        if (Type === "Audio") {
                            const Player = document.createElement("div");
                            Player.innerHTML = `<img src="../images/Play.svg" class="PlayButton">`;
                            Player.classList.add("Player");
                            Attachment.parentNode.appendChild(Player);
                    
                            let Playing = false;
                            const PlayButton = Player.querySelector(".PlayButton");
                            const Sound = new Audio(Attachment.getAttribute("src"));
                            Sound.addEventListener("loadedmetadata", () => {
                                PlayButton.addEventListener("click", () => {
                                    Playing = !Playing;
                                    if (Playing) {
                                        Sound.play();
                                        PlayButton.src = "../images/Pause.svg";
                                    } else {
                                        Sound.pause();
                                        PlayButton.src = "../images/Play.svg";
                                    }
                                });
                        
                                Sound.addEventListener("ended", () => {
                                    Playing = false;
                                    PlayButton.src = "../images/Play.svg";
                                });
                            });
                        }
                        Attachment.remove();
                    });
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
            
                // Add the new message to the local document object
                const NewMessages = [...Document.Messages, NewMessage];
                await new FireStorage("DMs").UpdateDocument(Document.id, { Messages: NewMessages });
                Document.Messages = NewMessages;
            
                // Append the new message to the chat without clearing the whole list
                const IsAuthor = NewMessage.Author === User.Username;
            
                const AuthorDocuments = await new FireStorage("Users").GetDocumentsByField("Username", NewMessage.Author);
                const AuthorDocument = AuthorDocuments[0];
            
                const MessageNode = document.createElement("div");
                MessageNode.style.order = NewMessage.Timestamp;
                MessageNode.innerHTML = `
                    <span style="--Color: ${Palette.Neon[Math.floor(Math.random() * Palette.Neon.length)]};">${NewMessage.Author}</span>
                    <span>${NewMessage.Content}</span>
                    <img src="${AuthorDocument.ProfileImage}">
                `;
                if (IsAuthor) MessageNode.setAttribute("client", "");
                Chat.querySelector(".Messages").appendChild(MessageNode);
            
                Input.value = ""; // Clear the input field
            }
            

            Chat.querySelector(".Input .SendButton").addEventListener("click", SendMessage);
            Chat.querySelector(".Input input").addEventListener("keydown", (Event) => {
                if (Event.key === "Enter") SendMessage();
            });

            let Recording = false;
            let NewRecord = null;
            let Label = null;
            Chat.querySelector(".Input .MicButton").addEventListener("click", () => {
                const Dump = async (FileObject) => {
                    const FileBlob = new Blob([FileObject], { type: "audio/wav" });
                    const DumpedFile = new File([FileBlob], "recording.wav");

                    const Path = `kumchat/${Uuid(8)}.${DumpedFile.name.split(".")[1]}`;
                    await new GithubStorage(DumpedFile).Upload(Path);

                    const Url = `https://github.com/kayyraa/DirectStorage/blob/main/${Path}?raw=true`;
                    const Message = {
                        Author: User.Username,
                        Content: `<audio>${Url}</audio>`,
                        Timestamp: Math.floor(Date.now() / 1000),
                    };

                    const NewMessages = [...Document.Messages, Message];
                    await new FireStorage("DMs").UpdateDocument(Document.id, { Messages: NewMessages });
                    Document.Messages = NewMessages;
                    requestAnimationFrame(UpdateMessages);
                };

                if (!Recording) {
                    Recording = true;

                    let Time = 0;
                    Label = new Action(`<span class="Value">${new Format(Time).ConvertEpochToReadable("mm:ss")}</span> <span>-</span> <span>5:00</span> <div class="Dot"></div>`).Append();
                    Label.classList.add("Record");

                    NewRecord = new Record(async (FileObject) => {
                        await Dump(FileObject);
                        Recording = false;
                        NewRecord = null;

                        Label.style.opacity = "0";
                        setTimeout(() => Label.remove(), 250);
                    });

                    NewRecord.Start();

                    function Update() {
                        if (!Recording) return;

                        Time++;
                        Label.querySelector(".Value").innerHTML = new Format(Time).ConvertEpochToReadable("mm:ss");

                        if (Time >= 300) {
                            NewRecord?.Stop();
                            return;
                        } else setTimeout(Update, 1000);
                    }

                    Update();
                } else {
                    Recording = false;
                    NewRecord?.Stop();
                }
            });

            UpdateMessages();
        });
    });

    Fetched = true;
    let FirstSnapshot = true;

    if (Fetched) {
        return;
        new FireStorage("DMs").OnSnapshot((Snapshot) => {
            if (FirstSnapshot) {
                FirstSnapshot = false;
                return;
            }
        
            Snapshot.docs.forEach((Document) => {
                Document.data().Messages.forEach(async (Message) => {
                    const IsAuthor = Message.Author === User.Username;
        
                    const AuthorDocuments = await new FireStorage("Users").GetDocumentsByField("Username", Message.Author);
                    const AuthorDocument = AuthorDocuments[0];
        
                    const MessageNode = document.createElement("div");
                    MessageNode.style.order = Message.Timestamp;
                    MessageNode.innerHTML = `
                        <span>${Message.Content}</span>
                        <img src="${AuthorDocument.ProfileImage}">
                    `;
                    if (IsAuthor) MessageNode.setAttribute("client", "");
                    Chat.querySelector(".Messages").appendChild(MessageNode);
        
                    if (IsAuthor) {
                        Dropdown.innerHTML = `<div class="DeleteButton">Delete</div>`;
                        MessageNode.ClickAndHold((Event) => {
                            ShowDropdown();
                            MoveDropdown(Event.clientX, Event.clientY);
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
                            Document.data().Messages = NewMessages;
        
                            requestAnimationFrame(UpdateMessages);
                            HideDropdown();
                        });
                    }
                });
            });
        });   
    }
};

document.addEventListener("DOMContentLoaded", FetchDMs);
document.addEventListener("DOMContentLoaded", () => SwitchFrame("Chats"));