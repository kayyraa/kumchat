globalThis.Functions = {
    Report: (Text, Image) => {
        new Notification({
            Text: Text,
            Image: Image
        }).Append();

        HideDropdown();
    }
};