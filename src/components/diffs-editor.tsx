import { ArrowsLeftRightIcon } from "@phosphor-icons/react";
import { formatForDisplay, useHotkey } from "@tanstack/react-hotkeys";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import DiffView from "./diff-view";
import EditView from "./edit-view";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export default function DiffsEditor() {
	const { view } = useSearch({ from: "/" });
	const navigate = useNavigate({ from: "/" });
	const [oldCode, setOldCode] = useState("");
	const [newCode, setNewCode] = useState("");

	const isDiff = view === "diff";
	const bothEmpty = !oldCode && !newCode;

	const toggle = () => {
		if (!isDiff && bothEmpty) return;
		navigate({ search: { view: isDiff ? "edit" : "diff" } });
	};

	const swapContents = () => {
		const temp = oldCode;
		setOldCode(newCode);
		setNewCode(temp);
	};

	const resetContents = () => {
		setOldCode("");
		setNewCode("");
	};

	useHotkey("Mod+Enter", toggle);
	useHotkey("Mod+S", swapContents);

	return (
		<div className="h-svh w-svw p-6">
			<div className="flex h-full flex-col gap-4">
				<div className="flex gap-2">
					<Tooltip>
						<TooltipTrigger
							render={
								isDiff ? (
									<Button
										variant="outline"
										size="lg"
										onClick={toggle}
										className="flex-1"
									>
										Back to editor
									</Button>
								) : (
									<Button
										size="lg"
										variant="outline"
										onClick={toggle}
										disabled={bothEmpty}
										className="flex-1"
									>
										Compare
									</Button>
								)
							}
						/>
						<TooltipContent>
							{formatForDisplay("Mod+Enter")}
						</TooltipContent>
					</Tooltip>
					<Button
						size="lg"
						variant="outline"
						className="flex-1"
						onClick={() => resetContents()}
					>
						Clear
					</Button>
					<Tooltip>
						<TooltipTrigger
							render={
								<Button
									variant="outline"
									size="lg"
									onClick={swapContents}
									className="flex-1"
								>
									<ArrowsLeftRightIcon className="h-4 w-4" />
									Swap
								</Button>
							}
						/>
						<TooltipContent>
							{formatForDisplay("Mod+S")}
						</TooltipContent>
					</Tooltip>
				</div>
				{isDiff ? (
					<DiffView oldCode={oldCode} newCode={newCode} />
				) : (
					<EditView
						oldCode={oldCode}
						setOldCode={setOldCode}
						newCode={newCode}
						setNewCode={setNewCode}
					/>
				)}
			</div>
		</div>
	);
}
