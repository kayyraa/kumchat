import * as Firebase from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import * as Firestore from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";

globalThis.FirebaseConfig = {
    apiKey: "AIzaSyDeawUe5rr-_0AGBnI6IU_3GAWzkT7G9Jw",
    authDomain: "kumchat-b41b4.firebaseapp.com",
    projectId: "kumchat-b41b4",
    storageBucket: "kumchat-b41b4.firebasestorage.app",
    messagingSenderId: "100782498970",
    appId: "1:100782498970:web:800a52267eb9c368f1eb23",
    measurementId: "G-4DCVFM4GSK"
};

globalThis.GithubStorageConfig = {
    Token: "",
    StorageOwner: "kayyraa",
    StorageName: "DirectStorage"
};

export const App = Firebase.initializeApp(FirebaseConfig);
export const Analytics = getAnalytics(App);
export const Db = Firestore.getFirestore(App);

globalThis.ActiveDm = null;

globalThis.AccountButton = document.querySelector(".AccountButton");
globalThis.Chatlist = document.querySelector(".Chatlist");
globalThis.Chat = document.querySelector(".Chat");
globalThis.Dropdown = document.querySelector(".Dropdown");
globalThis.Search = document.querySelector(".Search");
globalThis.NotificationContainer = document.querySelector(".NotificationContainer");
globalThis.ActionContainer = document.querySelector(".Action");
globalThis.Reply = document.querySelector(".Reply");
globalThis.Header = document.querySelector(".Header");

globalThis.NewChatButton = document.querySelector(".NewChatButton");
globalThis.MoreButton = document.querySelector(".MoreButton");
globalThis.UploadMediaButton = document.querySelector(".UploadMediaButton");

globalThis.Frames = Array.from(document.querySelector(".Frames").children);

globalThis.GithubStorage = class {
    constructor(Document) {
        this.File = Document || null;
    }

    async Upload(Path = "") {
        if (!this.File) throw new Error("No file provided for upload.");
        const FileContent = await this.ReadFileAsBase64(this.File);

        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;
        const Data = {
            message: "Upload file to repo",
            content: FileContent
        };

        const Response = await fetch(Url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${GithubStorageConfig.Token}`,
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify(Data)
        });

        const Result = await Response.json();
        if (Response.ok) {
            console.log("File uploaded:", Result.content.html_url);
        } else {
            console.error("Upload failed:", Result);
        }
    }

    async Download(Path) {
        const Url = `https://api.github.com/repos/${GithubStorageConfig.StorageOwner}/${GithubStorageConfig.StorageName}/contents/${Path}`;

        const Response = await fetch(Url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${GithubStorageConfig.Token}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (Response.ok) {
            const Result = await Response.json();
            const FileContent = atob(Result.content); // Decode Base64 content
            const Blob = new Blob([FileContent], { type: "application/octet-stream" });
            return new File([Blob], Path.split("/").pop(), { type: Blob.type });
        } else {
            const ErrorData = await Response.json();
            console.error("Failed to fetch file:", ErrorData);
            throw new Error(ErrorData.message || "File fetch failed");
        }
    }

    async ReadFileAsBase64(File) {
        return new Promise((Resolve, Reject) => {
            const Reader = new FileReader();
            Reader.onload = () => Resolve(Reader.result.split(",")[1]);
            Reader.onerror = Reject;
            Reader.readAsDataURL(File);
        });
    }
}

globalThis.FireStorage = class {
    constructor(Collection = "") {
        this.Collection = Collection;
    }

    async AppendDocument(DocumentData) {
        if (!this.Collection) return;
        const DocRef = await Firestore.addDoc(Firestore.collection(Db, this.Collection), DocumentData);
        return DocRef.id;
    }

    async GetDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        const Snapshot = await Firestore.getDoc(DocRef);

        if (Snapshot.exists()) return { id: Snapshot.id, ...Snapshot.data() };
        else return null;
    }

    async UpdateDocument(DocumentId, DocumentData) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.updateDoc(DocRef, DocumentData);
    }

    async DeleteDocument(DocumentId) {
        if (!this.Collection) return;
        const DocRef = Firestore.doc(Db, this.Collection, DocumentId);
        await Firestore.deleteDoc(DocRef);
    }

    async GetDocuments(Query = {}) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        let QueryRef = CollectionRef;
        Object.entries(Query).forEach(([Key, Value]) => {
            QueryRef = Firestore.query(QueryRef, Firestore.where(Key, "==", Value));
        });
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentsByField(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, "==", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    async GetDocumentByFieldIncludes(FieldName, FieldValue) {
        if (!this.Collection) return;
        const QueryRef = Firestore.query(
            Firestore.collection(Db, this.Collection),
            Firestore.where(FieldName, ">=", FieldValue)
        );
        const QuerySnapshot = await Firestore.getDocs(QueryRef);
        return QuerySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    OnSnapshot(Callback) {
        if (!this.Collection) return;
        const CollectionRef = Firestore.collection(Db, this.Collection);
        Firestore.onSnapshot(CollectionRef, (Snapshot) => {
            Callback(Snapshot);
        });
    }
}

globalThis.Prompt = class {
    constructor(Prompt = { Title: "", Nodes: [] }, Style = ["", {}]) {
        this.Title = Prompt.Title;
        this.Nodes = Prompt.Nodes;
        this.Style = Style;
        this.Prompt = null;
    }

    Append() {
        const Prompt = document.createElement("div");
        Prompt.setAttribute("class", "Prompt");
        if (this.Style[0] === undefined || this.Style[0] === "self") Object.keys(this.Style[1]).forEach(Key => Prompt.style[Key] = this.Style[1][Key]);

        Prompt.innerHTML = `
            <div class="Topbar">
                <span>${this.Title}</span>
                <div button>X</div>
            </div>
            <div class="Content"></div>
        `;

        document.body.appendChild(Prompt);
        this.Prompt = Prompt;

        Prompt.setAttribute("style", `
            position: absolute;
            left: ${window.innerWidth / 2}px;
            top: ${window.innerHeight / 2}px;
        `);

        this.Style[0] ? this.Style[0] !== "self" ? Object.keys(this.Style[1]).forEach(Key => Prompt.querySelector(this.Style[0]).style[Key] = this.Style[1][Key]) : "" : "";
        Prompt.querySelector("div[button]").addEventListener("click", () => Prompt.remove());

        this.Nodes.forEach(Node => {
            if (!(Node instanceof HTMLElement)) return;
            this.Prompt.querySelector(".Content").appendChild(Node);
        });

        let Dragging = false;
        let StartX = 0;
        let StartY = 0;

        Prompt.querySelector(".Topbar").addEventListener("mousedown", (Event) => {
            Dragging = true;
            StartX = Event.clientX - parseInt(Prompt.style.left);
            StartY = Event.clientY - parseInt(Prompt.style.top);
        });

        document.addEventListener("mousemove", (Event) => {
            if (!Dragging) return;
            Prompt.style.left = `${Event.clientX - StartX}px`;
            Prompt.style.top = `${Event.clientY - StartY}px`;
        });

        document.addEventListener("mouseup", () => Dragging = false);

        return Prompt;
    }

    Remove() {
        if (!this.Prompt) return;
        this.Prompt.remove();
    }
}

globalThis.Format = class {
    constructor(Value) {
        this.Value = Value;
    }

    ConvertEpochToReadable(Pattern) {
        const NewDate = new Date(this.Value * 1000);
        const CurrentDate = new Date();

        const Hours = String(NewDate.getHours()).padStart(2, "0");
        const Minutes = String(NewDate.getMinutes()).padStart(2, "0");
        const Day = String(NewDate.getDate()).padStart(2, "0");
        const Month = String(NewDate.getMonth() + 1).padStart(2, "0");
        const Year = NewDate.getFullYear();

        const TimeDifference = CurrentDate - NewDate;
        const SecondsAgo = Math.floor(TimeDifference / 1000);
        const MinutesAgo = Math.floor(TimeDifference / (1000 * 60));
        const HoursAgo = Math.floor(TimeDifference / (1000 * 60 * 60));
        const DaysAgo = Math.floor(TimeDifference / (1000 * 60 * 60 * 24));
        const MonthsAgo = Math.floor(TimeDifference / (1000 * 60 * 60 * 24 * 30));
        const YearsAgo = Math.floor(TimeDifference / (1000 * 60 * 60 * 24 * 30 * 365));

        const Selectors = {
            "ss": SecondsAgo,
            "mm": MinutesAgo,
            "hh": HoursAgo,
            "dd": DaysAgo,
            "mo": MonthsAgo,
            "yy": YearsAgo
        }

        if (Pattern.split(" ").find(Now => Now.startsWith("&now")) &&
            Selectors[Pattern.split(" ").find(Now => Now.startsWith("&now")).split(":")[1]] <= parseInt(Pattern.split(" ").find(Now => Now.startsWith("&now")).split(":")[2])) return "now";

        if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo === 0) return `${MinutesAgo} minute${MinutesAgo > 1 ? "s" : ""} ago`;
        if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24 * 7) return `${(DaysAgo % 7) + 1} week${DaysAgo % 7 > 1 ? "s" : ""} ago`;
        if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24) return `${DaysAgo} day${DaysAgo > 1 ? "s" : ""} ago`;
        if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24 * 30) return `${MonthsAgo} months${MonthsAgo > 1 ? "s" : ""} ago`;
        if (Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim() === "hh and mm ago" && HoursAgo >= 24 * 30 * 12) return `${YearsAgo} year${YearsAgo > 1 ? "s" : ""} ago`;

        const Patterns = {
            "hh:mm:ss dd.mm.yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Day}.${Month}.${Year}`,
            "hh:mm:ss dd/mm/yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Day}/${Month}/${Year}`,
            "hh:mm:ss mm.yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Month}.${Year}`,
            "hh:mm:ss mm/yyyy": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")} ${Month}/${Year}`,
            "hh:mm:ss": `${Hours}:${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")}`,
            "hh:mm dd.mm.yyyy": `${Hours}:${Minutes} ${Day}.${Month}.${Year}`,
            "hh:mm dd/mm/yyyy": `${Hours}:${Minutes} ${Day}/${Month}/${Year}`,
            "hh:mm mm.yyyy": `${Hours}:${Minutes} ${Month}.${Year}`,
            "hh:mm mm/yyyy": `${Hours}:${Minutes} ${Month}/${Year}`,
            "hh:mm yyyy": `${Hours}:${Minutes} ${Year}`,
            "hh:mm": `${Hours}:${Minutes}`,
            "mm:ss": `${Minutes}:${String(NewDate.getSeconds()).padStart(2, "0")}`,
            "dd.mm.yyyy": `${Day}.${Month}.${Year}`,
            "dd/mm/yyyy": `${Day}/${Month}/${Year}`,
            "mm.yyyy": `${Month}.${Year}`,
            "mm/yyyy": `${Month}/${Year}`,
            "yyyy": `${Year}`,
            "mm ago": `${MinutesAgo} minutes ago`,
            "hh ago": `${HoursAgo} hours ago`,
            "dd ago": `${DaysAgo} days ago`,
            "hh and mm ago": `${HoursAgo} hours and ${MinutesAgo % 60} minutes ago`,
            "hh and mm and yyyy ago": `${HoursAgo} hours, ${MinutesAgo % 60} minutes, and ${Year} years ago`,
            "dd hh and mm and yyyy ago": `${DaysAgo} days, ${HoursAgo % 24} hours, ${MinutesAgo % 60} minutes, and ${Year} years ago`,
        };

        return Patterns[Pattern.replace(Pattern.split(" ").find(Now => Now.startsWith("&now")), "").trim()] || "";
    }
}

globalThis.Notification = class {
    constructor(Body = {
        Text: "",
        Image: ""
    }, Style = {}, Timeout = 5000) {
        this.Body = Body;
        this.Style = Style;
        this.Timeout = Timeout;
    }

    Append() {
        let Content = "";
        this.Body.Text.split(" ").forEach(Word => {
            if (Word.startsWith("<") && Word.endsWith(">")) Content += Word;
            else Content += `<span>${Word}</span>`;
        });

        const Node = document.createElement("div");
        Node.innerHTML = `
            <span>${Content}</span>
            ${this.Body.Image ? `<img src="${this.Body.Image}">` : ""}
        `;
        Node.style.opacity = "0";
        NotificationContainer.appendChild(Node);
        Object.keys(this.Style).forEach(Key => Node.style[Key] = this.Style[Key]);

        setTimeout(() => Node.style.opacity = "1", 250);

        setTimeout(() => {
            Node.style.opacity = "0";
            setTimeout(() => Node.remove(), 250);
        }, this.Timeout - 250);
    }
}

globalThis.Action = class {
    constructor(Text, Timeout = Infinity) {
        this.Text = Text;
        this.Timeout = Timeout;
    }

    Append() {
        const Node = document.createElement("div");
        Node.innerHTML = this.Text;
        Node.style.opacity = "0";
        ActionContainer.appendChild(Node);
        this.Node = Node;

        setTimeout(() => Node.style.opacity = "1", 250);
        return Node;
    }

    Fade() {
        if (!this.Node) return;
        if (this.Timeout !== Infinity) {
            setTimeout(() => {
                this.Node.style.opacity = "0"
                setTimeout(() => this.Node.remove(), 250);
            }, this.Timeout - 250);
        } else {
            this.Node.style.opacity = "0"
            setTimeout(() => this.Node.remove(), 250);
        }
    }

    Update(New = {}) {
        if (!this.Node) return;
        Object.keys(New).forEach(Key => this.Node[Key] = New[New]);
    }
}

globalThis.Record = class {
    constructor(FileDump = () => { }) { this.FileDump = FileDump; }

    async Start() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert("Your browser does not support audio recording.");
            return false;
        }

        const Stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const Recorder = new MediaRecorder(Stream, { mimeType: "audio/webm" });
        let Chunks = [];

        Recorder.ondataavailable = (Event) => Chunks.push(Event.data);

        Recorder.onstop = async () => {
            const FileBlob = new Blob(Chunks, { type: "audio/webm" });
            const FileObject = new File([FileBlob], "Recording.webm", { type: "audio/webm" });
            this.FileDump(FileObject);

            Stream.getTracks().forEach(Track => Track.stop());
            this.Recorder = null;
        };

        Recorder.start();
        this.Recorder = Recorder;
    }

    Stop() {
        if (!this.Recorder) return;
        this.Recorder.stop();
        this.Recorder = null;
    }
}

globalThis.MoveDropdown = (PosX, PosY, RevertX = false) => {
    const SizeX = Dropdown.clientWidth;
    const SizeY = Dropdown.clientHeight;

    let OverflowX = false;
    let OverflowY = false;
    if (SizeX + PosX >= window.innerWidth) OverflowX = true;
    if (SizeY + PosY >= window.innerHeight) OverflowY = true;
    RevertX ? OverflowX = true : false;

    Dropdown.style.left = `${OverflowX ? PosX - SizeX / 2 : PosX + SizeX / 2}px`;
    Dropdown.style.top = `${OverflowY ? PosY - SizeY / 2 : PosY + SizeY / 2}px`;
};

globalThis.ShowDropdown = () => {
    Dropdown.style.opacity = "1";
    Dropdown.style.pointerEvents = "auto";
};

globalThis.HideDropdown = () => {
    Dropdown.style.opacity = "0";
    Dropdown.style.pointerEvents = "none";
};

globalThis.TruncateString = (String, Length, Suffix) => String.length > Length ? `${String.slice(0, Length)}${Suffix}` : String;

globalThis.Uuid = (Length = 16) => {
    if ((Length & (Length - 1)) !== 0 || Length < 2) return "";

    return Array.from({ length: Length }, () =>
        Math.floor(Math.random() * 16).toString(16)
    ).reduce((Acc, Char, Index) =>
        Acc + (Index && Index % (Length / 2) === 0 ? "-" : "") + Char, ""
    );
};

globalThis.CopyToClipboard = async (Text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(Text);
            console.log("Copied to clipboard");
            return;
        } catch (Error) {
            console.warn("Clipboard API failed, using fallback");
        }
    }

    const TempInput = document.createElement("textarea");
    TempInput.value = Text;
    document.body.appendChild(TempInput);
    TempInput.select();
    document.execCommand("copy");
    document.body.removeChild(TempInput);
    console.log("Fallback: Copied to clipboard");
};

Element.prototype.ClickAndHold = function (CallbackFunction, TimeoutDuration = 500) {
    let IsHeld = false;
    let ActiveHoldTimeout = null;

    const OnHoldStart = (Event) => {
        if (Event.button === 2) return;

        IsHeld = true;

        ActiveHoldTimeout = setTimeout(() => {
            if (IsHeld) {
                CallbackFunction(Event);
                IsHeld = false;
            }
        }, TimeoutDuration);
    };

    const OnHoldEnd = () => {
        IsHeld = false;
        clearTimeout(ActiveHoldTimeout);
    };

    ["mousedown", "touchstart"].forEach(EventType => {
        this.addEventListener(EventType, OnHoldStart, { passive: false });
    });

    ["mouseup", "mouseleave", "mouseout", "touchend", "touchcancel"].forEach(EventType => {
        this.addEventListener(EventType, OnHoldEnd, { passive: false });
    });

    return this;
};

GithubStorageConfig.Token = await new FireStorage("Secrets").GetDocument("Token").then((Document) => Document.Value);

globalThis.Palette = {
    Neon: [
        "rgb(6, 208, 1)",
        "rgb(100, 153, 233)",
        "rgb(255, 157, 35)",
        "rgb(249, 56, 39)"
    ]
};

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