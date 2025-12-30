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
 * Computes a line-by-line diff using the Patience Diff algorithm.
 * This algorithm is better at handling moved blocks of code.
 */
export function computeDiff(left: string, right: string): DiffLine[] {
	const leftLines = splitLines(normalizeNewlines(left));
	const rightLines = splitLines(normalizeNewlines(right));

	const result: DiffLine[] = [];
	let leftLineNum = 1;
	let rightLineNum = 1;

	// Use Patience Diff to get the optimal alignment
	const lcs = patienceDiff(leftLines, rightLines);

	let leftIdx = 0;
	let rightIdx = 0;
	let lcsIdx = 0;

	while (leftIdx < leftLines.length || rightIdx < rightLines.length) {
		// Check if current positions match an LCS entry
		if (
			lcsIdx < lcs.length &&
			leftIdx === lcs[lcsIdx].leftIdx &&
			rightIdx === lcs[lcsIdx].rightIdx
		) {
			// Lines match - emit equal
			result.push({
				type: "equal",
				leftLine: leftLines[leftIdx],
				rightLine: rightLines[rightIdx],
				leftLineNumber: leftLineNum++,
				rightLineNumber: rightLineNum++,
			});
			leftIdx++;
			rightIdx++;
			lcsIdx++;
		} else {
			// Find next LCS match to know our boundaries
			const nextLcs = lcs[lcsIdx];
			const leftBound = nextLcs ? nextLcs.leftIdx : leftLines.length;
			const rightBound = nextLcs ? nextLcs.rightIdx : rightLines.length;

			// Collect unmatched lines
			const leftUnmatched: number[] = [];
			const rightUnmatched: number[] = [];

			while (leftIdx < leftBound) {
				leftUnmatched.push(leftIdx++);
			}
			while (rightIdx < rightBound) {
				rightUnmatched.push(rightIdx++);
			}

			// Try to pair similar lines as modifications
			const pairs = pairSimilarLines(
				leftUnmatched.map((i) => leftLines[i]),
				rightUnmatched.map((i) => rightLines[i]),
			);

			let leftU = 0;
			let rightU = 0;

			for (const pair of pairs) {
				// Emit any unpaired deletions before this pair
				while (leftU < pair.leftIdx) {
					result.push({
						type: "delete",
						leftLine: leftLines[leftUnmatched[leftU]],
						leftLineNumber: leftLineNum++,
					});
					leftU++;
				}
				// Emit any unpaired insertions before this pair
				while (rightU < pair.rightIdx) {
					result.push({
						type: "insert",
						rightLine: rightLines[rightUnmatched[rightU]],
						rightLineNumber: rightLineNum++,
					});
					rightU++;
				}
				// Emit the modification pair
				result.push({
					type: "modify",
					leftLine: leftLines[leftUnmatched[leftU]],
					rightLine: rightLines[rightUnmatched[rightU]],
					leftLineNumber: leftLineNum++,
					rightLineNumber: rightLineNum++,
				});
				leftU++;
				rightU++;
			}

			// Emit remaining unmatched lines
			while (leftU < leftUnmatched.length) {
				result.push({
					type: "delete",
					leftLine: leftLines[leftUnmatched[leftU]],
					leftLineNumber: leftLineNum++,
				});
				leftU++;
			}
			while (rightU < rightUnmatched.length) {
				result.push({
					type: "insert",
					rightLine: rightLines[rightUnmatched[rightU]],
					rightLineNumber: rightLineNum++,
				});
				rightU++;
			}
		}
	}

	return result;
}

/**
 * Patience Diff algorithm - finds LCS using unique lines as anchors
 */
function patienceDiff(
	left: string[],
	right: string[],
): Array<{ leftIdx: number; rightIdx: number }> {
	if (left.length === 0 || right.length === 0) {
		return [];
	}

	// Find unique lines in both arrays
	const leftUnique = new Map<string, number[]>();
	const rightUnique = new Map<string, number[]>();

	for (let i = 0; i < left.length; i++) {
		const line = left[i];
		if (!leftUnique.has(line)) {
			leftUnique.set(line, []);
		}
		leftUnique.get(line)!.push(i);
	}

	for (let i = 0; i < right.length; i++) {
		const line = right[i];
		if (!rightUnique.has(line)) {
			rightUnique.set(line, []);
		}
		rightUnique.get(line)!.push(i);
	}

	// Find lines that appear exactly once in both
	const uniqueMatches: Array<{ leftIdx: number; rightIdx: number }> = [];

	for (const [line, leftIndices] of leftUnique) {
		const rightIndices = rightUnique.get(line);
		if (
			leftIndices.length === 1 &&
			rightIndices &&
			rightIndices.length === 1
		) {
			uniqueMatches.push({
				leftIdx: leftIndices[0],
				rightIdx: rightIndices[0],
			});
		}
	}

	// Sort by left index
	uniqueMatches.sort((a, b) => a.leftIdx - b.leftIdx);

	// Find LIS (Longest Increasing Subsequence) by right index
	// This gives us the longest chain of unique matching lines
	const lis = longestIncreasingSubsequence(
		uniqueMatches.map((m) => m.rightIdx),
	);
	const anchors = lis.map((i) => uniqueMatches[i]);

	// If no unique anchors, fall back to standard LCS
	if (anchors.length === 0) {
		return standardLCS(left, right);
	}

	// Recursively diff between anchors
	const result: Array<{ leftIdx: number; rightIdx: number }> = [];

	let prevLeftIdx = 0;
	let prevRightIdx = 0;

	for (const anchor of anchors) {
		// Diff the section before this anchor
		const leftSection = left.slice(prevLeftIdx, anchor.leftIdx);
		const rightSection = right.slice(prevRightIdx, anchor.rightIdx);

		const subDiff = patienceDiff(leftSection, rightSection);
		for (const match of subDiff) {
			result.push({
				leftIdx: match.leftIdx + prevLeftIdx,
				rightIdx: match.rightIdx + prevRightIdx,
			});
		}

		// Add the anchor itself
		result.push(anchor);

		prevLeftIdx = anchor.leftIdx + 1;
		prevRightIdx = anchor.rightIdx + 1;
	}

	// Diff the section after the last anchor
	const leftSection = left.slice(prevLeftIdx);
	const rightSection = right.slice(prevRightIdx);

	const subDiff = patienceDiff(leftSection, rightSection);
	for (const match of subDiff) {
		result.push({
			leftIdx: match.leftIdx + prevLeftIdx,
			rightIdx: match.rightIdx + prevRightIdx,
		});
	}

	return result;
}

/**
 * Standard LCS algorithm for sections without unique lines
 */
function standardLCS(
	left: string[],
	right: string[],
): Array<{ leftIdx: number; rightIdx: number }> {
	const m = left.length;
	const n = right.length;

	if (m === 0 || n === 0) return [];

	// Build LCS table
	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		Array(n + 1).fill(0),
	);

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (left[i - 1] === right[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	// Backtrack to find actual LCS - prefer earlier matches in right array
	const result: Array<{ leftIdx: number; rightIdx: number }> = [];
	let i = m;
	let j = n;

	while (i > 0 && j > 0) {
		if (left[i - 1] === right[j - 1]) {
			// Check if we can get same LCS length by going left (earlier right match)
			if (j > 1 && dp[i][j - 1] === dp[i][j]) {
				j--;
			} else {
				result.unshift({ leftIdx: i - 1, rightIdx: j - 1 });
				i--;
				j--;
			}
		} else if (dp[i - 1][j] >= dp[i][j - 1]) {
			i--;
		} else {
			j--;
		}
	}

	return result;
}

/**
 * Find Longest Increasing Subsequence - returns indices
 */
function longestIncreasingSubsequence(arr: number[]): number[] {
	if (arr.length === 0) return [];

	const n = arr.length;
	const dp: number[] = Array(n).fill(1);
	const parent: number[] = Array(n).fill(-1);

	let maxLen = 1;
	let maxIdx = 0;

	for (let i = 1; i < n; i++) {
		for (let j = 0; j < i; j++) {
			if (arr[j] < arr[i] && dp[j] + 1 > dp[i]) {
				dp[i] = dp[j] + 1;
				parent[i] = j;
			}
		}
		if (dp[i] > maxLen) {
			maxLen = dp[i];
			maxIdx = i;
		}
	}

	// Reconstruct the subsequence
	const result: number[] = [];
	let idx = maxIdx;
	while (idx !== -1) {
		result.unshift(idx);
		idx = parent[idx];
	}

	return result;
}

/**
 * Pair similar unmatched lines as modifications
 */
function pairSimilarLines(
	left: string[],
	right: string[],
): Array<{ leftIdx: number; rightIdx: number }> {
	const pairs: Array<{ leftIdx: number; rightIdx: number; score: number }> =
		[];

	// Calculate similarity scores for all pairs
	for (let i = 0; i < left.length; i++) {
		for (let j = 0; j < right.length; j++) {
			const score = similarity(left[i], right[j]);
			// Lower threshold (0.2) to catch more modifications
			// Single char changes like "b" → "B" should still pair
			if (score > 0.2) {
				pairs.push({ leftIdx: i, rightIdx: j, score });
			}
		}
	}

	// Sort by score descending
	pairs.sort((a, b) => b.score - a.score);

	// Greedily select non-conflicting pairs
	const usedLeft = new Set<number>();
	const usedRight = new Set<number>();
	const result: Array<{ leftIdx: number; rightIdx: number }> = [];

	for (const pair of pairs) {
		if (!usedLeft.has(pair.leftIdx) && !usedRight.has(pair.rightIdx)) {
			result.push({ leftIdx: pair.leftIdx, rightIdx: pair.rightIdx });
			usedLeft.add(pair.leftIdx);
			usedRight.add(pair.rightIdx);
		}
	}

	// Sort by left index for proper ordering
	result.sort((a, b) => a.leftIdx - b.leftIdx);

	return result;
}

/**
 * Calculate similarity between two strings (0-1)
 */
function similarity(a: string, b: string): number {
	if (a === b) return 1;
	if (a.length === 0 || b.length === 0) return 0;

	// Trim and compare
	const aTrim = a.trim();
	const bTrim = b.trim();
	if (aTrim === bTrim) return 0.95;

	// For very short strings, use case-insensitive comparison
	if (aTrim.length <= 3 && bTrim.length <= 3) {
		if (aTrim.toLowerCase() === bTrim.toLowerCase()) return 0.9;
	}

	const minLen = Math.min(aTrim.length, bTrim.length);
	const maxLen = Math.max(aTrim.length, bTrim.length);

	if (minLen === 0) return 0;

	// Levenshtein-based similarity for short strings
	if (maxLen <= 10) {
		const dist = levenshtein(aTrim, bTrim);
		return 1 - dist / maxLen;
	}

	// For longer strings, use token-based comparison
	const aWords = aTrim.split(/\s+/);
	const bWords = bTrim.split(/\s+/);

	// Count matching words
	let wordMatches = 0;
	const maxWords = Math.max(aWords.length, bWords.length);
	const minWords = Math.min(aWords.length, bWords.length);

	for (let i = 0; i < minWords; i++) {
		if (aWords[i] === bWords[i]) {
			wordMatches++;
		} else if (
			aWords[i].toLowerCase() === bWords[i].toLowerCase() ||
			levenshtein(aWords[i], bWords[i]) <= 2
		) {
			wordMatches += 0.7;
		}
	}

	// Also check for common prefix
	let commonPrefix = 0;
	for (let i = 0; i < minLen; i++) {
		if (aTrim[i] === bTrim[i]) commonPrefix++;
		else break;
	}

	const wordScore = maxWords > 0 ? wordMatches / maxWords : 0;
	const prefixScore = commonPrefix / maxLen;

	return Math.max(wordScore, prefixScore);
}

/**
 * Levenshtein distance between two strings
 */
function levenshtein(a: string, b: string): number {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	const matrix: number[][] = [];

	for (let i = 0; i <= b.length; i++) {
		matrix[i] = [i];
	}
	for (let j = 0; j <= a.length; j++) {
		matrix[0][j] = j;
	}

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b[i - 1] === a[j - 1]) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1,
					matrix[i][j - 1] + 1,
					matrix[i - 1][j] + 1,
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

function normalizeNewlines(text: string): string {
	return text.replace(/\r\n?/g, "\n");
}

function splitLines(text: string): string[] {
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
		if (match.index > lastIndex) {
			tokens.push(text.substring(lastIndex, match.index));
		}
		tokens.push(match[0]);
		lastIndex = match.index + match[0].length;
	}
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

	// Use LCS on tokens
	const lcs = tokenLCS(leftTokens, rightTokens);

	const result: { left: CharDiff[]; right: CharDiff[] } = {
		left: [],
		right: [],
	};

	let leftIdx = 0;
	let rightIdx = 0;
	let lcsIdx = 0;

	while (leftIdx < leftTokens.length || rightIdx < rightTokens.length) {
		if (
			lcsIdx < lcs.length &&
			leftIdx === lcs[lcsIdx].leftIdx &&
			rightIdx === lcs[lcsIdx].rightIdx
		) {
			// Matching token
			appendCharDiff(result.left, "equal", leftTokens[leftIdx]);
			appendCharDiff(result.right, "equal", rightTokens[rightIdx]);
			leftIdx++;
			rightIdx++;
			lcsIdx++;
		} else {
			const nextLcs = lcs[lcsIdx];
			const leftBound = nextLcs ? nextLcs.leftIdx : leftTokens.length;
			const rightBound = nextLcs ? nextLcs.rightIdx : rightTokens.length;

			while (leftIdx < leftBound) {
				appendCharDiff(result.left, "delete", leftTokens[leftIdx]);
				leftIdx++;
			}
			while (rightIdx < rightBound) {
				appendCharDiff(result.right, "insert", rightTokens[rightIdx]);
				rightIdx++;
			}
		}
	}

	return result;
}

function appendCharDiff(
	arr: CharDiff[],
	type: "equal" | "insert" | "delete",
	text: string,
): void {
	if (arr.length > 0 && arr[arr.length - 1].type === type) {
		arr[arr.length - 1].text += text;
	} else {
		arr.push({ type, text });
	}
}

function tokenLCS(
	left: string[],
	right: string[],
): Array<{ leftIdx: number; rightIdx: number }> {
	const m = left.length;
	const n = right.length;

	if (m === 0 || n === 0) return [];

	const dp: number[][] = Array.from({ length: m + 1 }, () =>
		Array(n + 1).fill(0),
	);

	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			if (left[i - 1] === right[j - 1]) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
			} else {
				dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
			}
		}
	}

	const result: Array<{ leftIdx: number; rightIdx: number }> = [];
	let i = m;
	let j = n;

	while (i > 0 && j > 0) {
		if (left[i - 1] === right[j - 1]) {
			result.unshift({ leftIdx: i - 1, rightIdx: j - 1 });
			i--;
			j--;
		} else if (dp[i - 1][j] > dp[i][j - 1]) {
			i--;
		} else {
			j--;
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
