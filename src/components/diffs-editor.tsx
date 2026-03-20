import { useHotkey } from "@tanstack/react-hotkeys";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import DiffView from "./diff-view";
import EditView from "./edit-view";

export default function DiffsEditor() {
	const { view } = useSearch({ from: "/" });
	const navigate = useNavigate({ from: "/" });
	const [oldCode, setOldCode] = useState("");
	const [newCode, setNewCode] = useState("");

	const isDiff = view === "diff";

	const toggle = () =>
		navigate({ search: { view: isDiff ? "edit" : "diff" } });

	useHotkey("Mod+Enter", toggle);

	if (isDiff) {
		return <DiffView oldCode={oldCode} newCode={newCode} onBack={toggle} />;
	}

	return (
		<EditView
			oldCode={oldCode}
			setOldCode={setOldCode}
			newCode={newCode}
			setNewCode={setNewCode}
			onCompare={toggle}
		/>
	);
}
