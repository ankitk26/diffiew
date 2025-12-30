export type DiffLine = {
	type: "equal" | "insert" | "delete" | "modify";
	leftLine?: string;
	rightLine?: string;
	leftLineNumber?: number;
	rightLineNumber?: number;
	leftCharDiffs?: CharDiff[];
	rightCharDiffs?: CharDiff[];
};

export type CharDiff = {
	type: "equal" | "insert" | "delete";
	text: string;
};

/**
 * Computes a line-by-line diff between two texts using Myers' algorithm
 */
export function computeDiff(left: string, right: string): DiffLine[] {
	const leftLines = splitLines(normalizeNewlines(left));
	const rightLines = splitLines(normalizeNewlines(right));

	// Use a simple LCS-based approach with better matching
	const result: DiffLine[] = [];

	// Build a map of line content to positions for faster lookup
	const rightLineMap = new Map<string, number[]>();
	rightLines.forEach((line, idx) => {
		if (!rightLineMap.has(line)) {
			rightLineMap.set(line, []);
		}
		rightLineMap.get(line)!.push(idx);
	});

	let leftIndex = 0;
	let rightIndex = 0;
	let leftLineNum = 1;
	let rightLineNum = 1;

	while (leftIndex < leftLines.length || rightIndex < rightLines.length) {
		if (leftIndex >= leftLines.length) {
			// Only right side has lines
			result.push({
				type: "insert",
				rightLine: rightLines[rightIndex],
				rightLineNumber: rightLineNum++,
			});
			rightIndex++;
		} else if (rightIndex >= rightLines.length) {
			// Only left side has lines
			result.push({
				type: "delete",
				leftLine: leftLines[leftIndex],
				leftLineNumber: leftLineNum++,
			});
			leftIndex++;
		} else if (leftLines[leftIndex] === rightLines[rightIndex]) {
			// Lines match exactly
			result.push({
				type: "equal",
				leftLine: leftLines[leftIndex],
				rightLine: rightLines[rightIndex],
				leftLineNumber: leftLineNum++,
				rightLineNumber: rightLineNum++,
			});
			leftIndex++;
			rightIndex++;
		} else {
			// Lines differ - try to find the best match
			const currentLeft = leftLines[leftIndex];
			const possibleMatches = rightLineMap.get(currentLeft) || [];

			// Find the closest match in the remaining right lines
			let bestMatch = -1;
			let bestDistance = Infinity;

			for (const matchIdx of possibleMatches) {
				if (matchIdx >= rightIndex) {
					const distance = matchIdx - rightIndex;
					if (distance < bestDistance) {
						bestDistance = distance;
						bestMatch = matchIdx;
					}
				}
			}

			// Also check if current right line appears later in left
			const currentRight = rightLines[rightIndex];
			let leftMatch = -1;
			for (
				let i = leftIndex + 1;
				i < Math.min(leftIndex + 20, leftLines.length);
				i++
			) {
				if (leftLines[i] === currentRight) {
					leftMatch = i;
					break;
				}
			}

			if (
				bestMatch !== -1 &&
				bestMatch === rightIndex + 1 &&
				leftMatch === -1
			) {
				// Insert the right line first, then continue
				result.push({
					type: "insert",
					rightLine: rightLines[rightIndex],
					rightLineNumber: rightLineNum++,
				});
				rightIndex++;
			} else if (
				leftMatch !== -1 &&
				leftMatch === leftIndex + 1 &&
				bestMatch === -1
			) {
				// Delete the left line first, then continue
				result.push({
					type: "delete",
					leftLine: leftLines[leftIndex],
					leftLineNumber: leftLineNum++,
				});
				leftIndex++;
			} else if (bestMatch !== -1 && bestMatch < rightIndex + 10) {
				// Insert lines until we reach the match
				while (rightIndex < bestMatch) {
					result.push({
						type: "insert",
						rightLine: rightLines[rightIndex],
						rightLineNumber: rightLineNum++,
					});
					rightIndex++;
				}
			} else if (leftMatch !== -1 && leftMatch < leftIndex + 10) {
				// Delete lines until we reach the match
				while (leftIndex < leftMatch) {
					result.push({
						type: "delete",
						leftLine: leftLines[leftIndex],
						leftLineNumber: leftLineNum++,
					});
					leftIndex++;
				}
			} else {
				// Treat as modification
				result.push({
					type: "modify",
					leftLine: leftLines[leftIndex],
					rightLine: rightLines[rightIndex],
					leftLineNumber: leftLineNum++,
					rightLineNumber: rightLineNum++,
				});
				leftIndex++;
				rightIndex++;
			}
		}
	}

	return result;
}

function normalizeNewlines(text: string): string {
	// Normalize CRLF and CR to LF so diffs don't show spurious '\r' changes.
	return text.replace(/\r\n?/g, "\n");
}

function splitLines(text: string): string[] {
	// Treat empty input as having no lines, so "" -> [] (avoids a bogus modify vs insert/delete).
	if (text.length === 0) return [];
	return text.split("\n");
}

/**
 * Splits text into words and whitespace, preserving both
 */
function tokenize(text: string): string[] {
	const tokens: string[] = [];
	const wordRegex = /\S+/g;
	let lastIndex = 0;
	let match;

	while ((match = wordRegex.exec(text)) !== null) {
		// Add whitespace before word
		if (match.index > lastIndex) {
			tokens.push(text.substring(lastIndex, match.index));
		}
		// Add word
		tokens.push(match[0]);
		lastIndex = match.index + match[0].length;
	}
	// Add remaining whitespace
	if (lastIndex < text.length) {
		tokens.push(text.substring(lastIndex));
	}

	return tokens.length > 0 ? tokens : [text];
}

/**
 * Computes word-level differences within a line
 */
function computeCharDiff(
	left: string,
	right: string,
): { left: CharDiff[]; right: CharDiff[] } {
	const leftTokens = tokenize(left);
	const rightTokens = tokenize(right);
	const result: { left: CharDiff[]; right: CharDiff[] } = {
		left: [],
		right: [],
	};

	let leftIdx = 0;
	let rightIdx = 0;

	while (leftIdx < leftTokens.length || rightIdx < rightTokens.length) {
		if (leftIdx >= leftTokens.length) {
			// Only right side has tokens
			if (
				result.right.length > 0 &&
				result.right[result.right.length - 1].type === "insert"
			) {
				result.right[result.right.length - 1].text +=
					rightTokens[rightIdx];
			} else {
				result.right.push({
					type: "insert",
					text: rightTokens[rightIdx],
				});
			}
			rightIdx++;
		} else if (rightIdx >= rightTokens.length) {
			// Only left side has tokens
			if (
				result.left.length > 0 &&
				result.left[result.left.length - 1].type === "delete"
			) {
				result.left[result.left.length - 1].text += leftTokens[leftIdx];
			} else {
				result.left.push({ type: "delete", text: leftTokens[leftIdx] });
			}
			leftIdx++;
		} else if (leftTokens[leftIdx] === rightTokens[rightIdx]) {
			// Tokens match
			if (
				result.left.length > 0 &&
				result.left[result.left.length - 1].type === "equal"
			) {
				result.left[result.left.length - 1].text += leftTokens[leftIdx];
			} else {
				result.left.push({ type: "equal", text: leftTokens[leftIdx] });
			}
			if (
				result.right.length > 0 &&
				result.right[result.right.length - 1].type === "equal"
			) {
				result.right[result.right.length - 1].text +=
					rightTokens[rightIdx];
			} else {
				result.right.push({
					type: "equal",
					text: rightTokens[rightIdx],
				});
			}
			leftIdx++;
			rightIdx++;
		} else {
			// Tokens differ - try to find matching token ahead
			let foundMatch = false;
			const maxLookAhead = Math.min(
				10,
				Math.max(
					leftTokens.length - leftIdx,
					rightTokens.length - rightIdx,
				),
			);

			for (
				let lookAhead = 1;
				lookAhead <= maxLookAhead && !foundMatch;
				lookAhead++
			) {
				if (
					leftIdx + lookAhead < leftTokens.length &&
					leftTokens[leftIdx + lookAhead] === rightTokens[rightIdx]
				) {
					// Found match - left has deletions
					if (
						result.left.length > 0 &&
						result.left[result.left.length - 1].type === "delete"
					) {
						result.left[result.left.length - 1].text +=
							leftTokens[leftIdx];
					} else {
						result.left.push({
							type: "delete",
							text: leftTokens[leftIdx],
						});
					}
					leftIdx++;
					foundMatch = true;
				} else if (
					rightIdx + lookAhead < rightTokens.length &&
					leftTokens[leftIdx] === rightTokens[rightIdx + lookAhead]
				) {
					// Found match - right has insertions
					if (
						result.right.length > 0 &&
						result.right[result.right.length - 1].type === "insert"
					) {
						result.right[result.right.length - 1].text +=
							rightTokens[rightIdx];
					} else {
						result.right.push({
							type: "insert",
							text: rightTokens[rightIdx],
						});
					}
					rightIdx++;
					foundMatch = true;
				}
			}

			if (!foundMatch) {
				// Treat as modification - entire word changed
				if (
					result.left.length > 0 &&
					result.left[result.left.length - 1].type === "delete"
				) {
					result.left[result.left.length - 1].text +=
						leftTokens[leftIdx];
				} else {
					result.left.push({
						type: "delete",
						text: leftTokens[leftIdx],
					});
				}
				if (
					result.right.length > 0 &&
					result.right[result.right.length - 1].type === "insert"
				) {
					result.right[result.right.length - 1].text +=
						rightTokens[rightIdx];
				} else {
					result.right.push({
						type: "insert",
						text: rightTokens[rightIdx],
					});
				}
				leftIdx++;
				rightIdx++;
			}
		}
	}

	return result;
}

/**
 * Enhances diff lines with character-level differences
 */
export function enhanceWithCharDiffs(diffLines: DiffLine[]): DiffLine[] {
	return diffLines.map((line) => {
		if (line.type === "modify" && line.leftLine && line.rightLine) {
			const charDiff = computeCharDiff(line.leftLine, line.rightLine);
			return {
				...line,
				leftCharDiffs: charDiff.left,
				rightCharDiffs: charDiff.right,
			};
		}
		return line;
	});
}
