const assert = require('assert');

const parseDiff = (raw) => {
	// First split the patch header from the diff section
	const diffs = raw.split('diff --git ')
		.filter(d => !!d);
	
	return {
		raw: raw,
		diffs: diffs.map(diff => {
			const [ diffHeader, ...hunks ] = diff.split('\n@@');
			const diffLines = diffHeader.split('\n');

			// Alternative source/target file detection fallback,
			// in case the main method fails (this method has ambiguity issues)
			const { a, b } = gitDiffLineParser(diffLines[0]);
			
			const sourceLine =
				// Parse files changed/added/deleted
				diffLines.find(l => l.startsWith('--- '))
				||
				// Or just a file rename
				diffLines.find(l => l.startsWith('rename from '))
				||
				// No reference to the source file is found,
				// probably a 'new file mode', 'deleted file mode'
				undefined;
			
			let sourceFile = null;
			if (sourceLine === undefined) {
				sourceFile = a;
			}
			else if (sourceLine.startsWith('rename from ')) {
				sourceFile = sourceLine.substring('rename from '.length);
			}
			else {
				sourceFile = sourceLine.substr('--- '.length)
				
				if (sourceFile === '/dev/null') {
					// New file, source is ''
					sourceFile = '';
				}
				else {
					sourceFile = sourceFile.substring('a/'.length);
				}
			}
			
			const targetLine =
				// Parse files changed/added/deleted
				diffLines.find(l => l.startsWith('+++ '))
				// Or just a file rename
				||
				diffLines.find(l => l.startsWith('rename to '))
				||
				// No reference to the target file is found,
				// probably a 'new file mode', 'deleted file mode'
				undefined;
			
			let targetFile = null;
			if (targetLine === undefined) {
				targetFile = b;
			}
			else if (targetLine.startsWith('rename to ')) {
				targetFile = targetLine.substring('rename to '.length);
			}
			else {
				targetFile = sourceLine?.substr('+++ '.length);
				
				if (targetFile === '/dev/null') {
					// Deleted file, target is ''
					targetFile = '';
				}
				else {
					targetFile = targetFile.substring('b/'.length);
				}
			}
			
			return {
				sourceFile,
				targetFile,
				hunks: hunks.map(hunk => {
					const endOfChanges = hunk.indexOf(' @@');
					const lineChanges = hunk.substr(0, endOfChanges).trim();
					const rawChanges = hunk.substr(endOfChanges + ' @@'.length);
					const rawLines = rawChanges.split('\n');
					return {
						lineChanges: lineChanges,
						rawChanges: rawChanges,
						addedLines: rawLines.filter(l => l[0] === '+').map(l => l.substr(1)),
						removedLines: rawLines.filter(l => l[0] === '-').map(l => l.substr(1)),
						linesAdded: rawLines.filter(l => l[0] === '+').length,
						linesRemoved: rawLines.filter(l => l[0] === '-').length,
					};
				})
			}
		})
	};
};

// Parse a line like:
// diff --git a/my/file/path.txt b/my/file/path.txt
// There are various issues with the format of this line, and file paths that contain spaces
// + a/b, like ' a' or ' b' are simply not possible to unambigously to parse
// Making the most it without going too crazy
// For reference, some interesting puzzles:
// https://github.com/go-gitea/gitea/issues/14812#issuecomment-787059880
function gitDiffLineParser(line) {
	const [a, ...b] = line.split(' b/');
	return { a: a.substring(2), b: b.join(' b/') };
}

module.exports = parseDiff;

assert.equal(gitDiffLineParser('a/my/file.txt b/my/file.txt').a, 'my/file.txt');
assert.equal(gitDiffLineParser('a/my/file.txt b/my/file.txt').b, 'my/file.txt');
assert.equal(gitDiffLineParser('a/my/file.txt b/my/new-file.txt').a, 'my/file.txt');
assert.equal(gitDiffLineParser('a/my/file.txt b/my/new-file.txt').b, 'my/new-file.txt');
assert.equal(gitDiffLineParser('a/my/file b/file.txt b/my/file.txt').a, 'my/file');
assert.equal(gitDiffLineParser('a/my/file b/file.txt b/my/file.txt').b, 'file.txt b/my/file.txt');

// Sample taken from dependabot working on dependabot
// https://github.com/dependabot/dependabot-core/commit/d3c422beb34ce7e93567876111f82b1bf484f46c.diff
const diff1 = `diff --git a/composer/helpers/v2/composer.json b/composer/helpers/v2/composer.json
index 58a9737013b..524c8726df3 100644
--- a/composer/helpers/v2/composer.json
+++ b/composer/helpers/v2/composer.json
@@ -6,7 +6,7 @@
     },
     "require-dev": {
         "friendsofphp/php-cs-fixer": "^3.0",
-        "phpstan/phpstan": "~1.6.4"
+        "phpstan/phpstan": "~1.7.1"
     },
     "autoload": {
         "psr-4": {
diff --git a/composer/helpers/v2/composer.lock b/composer/helpers/v2/composer.lock
index fa608909bea..4a490bca340 100644
--- a/composer/helpers/v2/composer.lock
+++ b/composer/helpers/v2/composer.lock
@@ -4,7 +4,7 @@
         "Read more about it at https://getcomposer.org/doc/01-basic-usage.md#installing-dependencies",
         "This file is @generated automatically"
     ],
-    "content-hash": "f009496780e9f8a7f35fbdda5f7f00b6",
+    "content-hash": "fe0332e314087c171ff618dd3d67d8d9",
     "packages": [
         {
             "name": "composer/ca-bundle",
@@ -2108,16 +2108,16 @@
         },
         {
             "name": "phpstan/phpstan",
-            "version": "1.6.8",
+            "version": "1.7.1",
             "source": {
                 "type": "git",
                 "url": "https://github.com/phpstan/phpstan.git",
-                "reference": "d76498c5531232cb8386ceb6004f7e013138d3ba"
+                "reference": "e3baed2ee2ef322e0f9b8fe8f87fdbe024c7c719"
             },
             "dist": {
                 "type": "zip",
-                "url": "https://api.github.com/repos/phpstan/phpstan/zipball/d76498c5531232cb8386ceb6004f7e013138d3ba",
-                "reference": "d76498c5531232cb8386ceb6004f7e013138d3ba",
+                "url": "https://api.github.com/repos/phpstan/phpstan/zipball/e3baed2ee2ef322e0f9b8fe8f87fdbe024c7c719",
+                "reference": "e3baed2ee2ef322e0f9b8fe8f87fdbe024c7c719",
                 "shasum": ""
             },
             "require": {
@@ -2159,7 +2159,7 @@
                     "type": "tidelift"
                 }
             ],
-            "time": "2022-05-10T06:54:21+00:00"
+            "time": "2022-05-24T09:05:09+00:00"
         },
         {
             "name": "psr/cache",
`;

const parsedDiff1 = parseDiff(diff1);
assert.equal(parsedDiff1.diffs[0].sourceFile, parsedDiff1.diffs[0].targetFile);
assert.equal(parsedDiff1.diffs[0].hunks.length, 1);

assert.equal(parsedDiff1.diffs[0].hunks[0].lineChanges, '-6,7 +6,7');
assert.equal(parsedDiff1.diffs[0].hunks[0].linesAdded, 1);
assert.equal(parsedDiff1.diffs[0].hunks[0].linesRemoved, 1);

assert.equal(parsedDiff1.diffs[1].hunks[0].linesAdded, 1);
assert.equal(parsedDiff1.diffs[1].hunks[0].addedLines.length, 1);
assert.equal(parsedDiff1.diffs[1].hunks[0].linesRemoved, 1);
assert.equal(parsedDiff1.diffs[1].hunks[0].removedLines.length, 1);

assert.equal(parsedDiff1.diffs[1].hunks[1].linesAdded, 4);
assert.equal(parsedDiff1.diffs[1].hunks[1].addedLines.length, 4);
assert.equal(parsedDiff1.diffs[1].hunks[1].linesRemoved, 4);
assert.equal(parsedDiff1.diffs[1].hunks[1].removedLines.length, 4);

assert.equal(parsedDiff1.diffs[1].hunks[2].linesAdded, 1);
assert.equal(parsedDiff1.diffs[1].hunks[2].addedLines.length, 1);
assert.equal(parsedDiff1.diffs[1].hunks[2].linesRemoved, 1);
assert.equal(parsedDiff1.diffs[1].hunks[2].removedLines.length, 1);
