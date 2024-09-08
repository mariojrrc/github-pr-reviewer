const assert = require('assert');

const parseDiff = require('./parse-diff.js');

const parsePatch = (raw) => {
	// First split the patch header from the diff section
	const splitWith = 'diff --git ';
	const splitAt = raw.indexOf(splitWith);
	const header = raw.substring(0, splitAt);
	const diffs = raw.substring(splitAt);

	return {
		raw: raw,
		header: header,
		diffs: parseDiff(diffs).diffs,
	};
};

module.exports = parsePatch;

// Sample taken from dependabot working on dependabot
// https://github.com/dependabot/dependabot-core/commit/d3c422beb34ce7e93567876111f82b1bf484f46c.patch
const patch1 = `From d3c422beb34ce7e93567876111f82b1bf484f46c Mon Sep 17 00:00:00 2001
From: "dependabot[bot]" <49699333+dependabot[bot]@users.noreply.github.com>
Date: Wed, 25 May 2022 06:10:20 +0000
Subject: [PATCH] build(deps-dev): bump phpstan/phpstan in /composer/helpers/v2

Bumps [phpstan/phpstan](https://github.com/phpstan/phpstan) from 1.6.8 to 1.7.1.
- [Release notes](https://github.com/phpstan/phpstan/releases)
- [Changelog](https://github.com/phpstan/phpstan/blob/1.7.x/CHANGELOG.md)
- [Commits](https://github.com/phpstan/phpstan/compare/1.6.8...1.7.1)

---
updated-dependencies:
- dependency-name: phpstan/phpstan
  dependency-type: direct:development
  update-type: version-update:semver-minor
...

Signed-off-by: dependabot[bot] <support@github.com>
---
 composer/helpers/v2/composer.json |  2 +-
 composer/helpers/v2/composer.lock | 12 ++++++------
 2 files changed, 7 insertions(+), 7 deletions(-)

diff --git a/composer/helpers/v2/composer.json b/composer/helpers/v2/composer.json
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

const parsed1 = parsePatch(patch1);
assert.equal(parsed1.header.length, 904);
assert.equal(parsed1.diffs.length, 2);
assert.equal(parsed1.diffs[0].sourceFile, parsed1.diffs[0].targetFile);
assert.equal(parsed1.diffs[0].hunks.length, 1);

assert.equal(parsed1.diffs[0].hunks[0].lineChanges, '-6,7 +6,7');
assert.equal(parsed1.diffs[0].hunks[0].linesAdded, 1);
assert.equal(parsed1.diffs[0].hunks[0].linesRemoved, 1);

assert.equal(parsed1.diffs[1].hunks[0].linesAdded, 1);
assert.equal(parsed1.diffs[1].hunks[0].addedLines.length, 1);
assert.equal(parsed1.diffs[1].hunks[0].linesRemoved, 1);
assert.equal(parsed1.diffs[1].hunks[0].removedLines.length, 1);

assert.equal(parsed1.diffs[1].hunks[1].linesAdded, 4);
assert.equal(parsed1.diffs[1].hunks[1].addedLines.length, 4);
assert.equal(parsed1.diffs[1].hunks[1].linesRemoved, 4);
assert.equal(parsed1.diffs[1].hunks[1].removedLines.length, 4);

assert.equal(parsed1.diffs[1].hunks[2].linesAdded, 1);
assert.equal(parsed1.diffs[1].hunks[2].addedLines.length, 1);
assert.equal(parsed1.diffs[1].hunks[2].linesRemoved, 1);
assert.equal(parsed1.diffs[1].hunks[2].removedLines.length, 1);

const patch2 = `From bf593d996624a4a7581ea7d97f899e1829381553 Mon Sep 17 00:00:00 2001
From: nhosh <info@nho.sh>
Date: Thu, 01 Jun 2021 19:00:44 +0200
Subject: [PATCH] Moved files

---
 LICENSE => LICENSE-new     | 0
 README.md => README-new.md | 0
 2 files changed, 0 insertions(+), 0 deletions(-)
 rename LICENSE => LICENSE-new (100%)
 rename README.md => README-new.md (100%)

diff --git a/LICENSE b/LICENSE-new
similarity index 100%
rename from LICENSE
rename to LICENSE-new
diff --git a/README.md b/README-new.md
similarity index 100%
rename from README.md
rename to README-new.md
`;

const parsed2 = parsePatch(patch2);
assert.equal(parsed2.header.length, 364);
assert.equal(parsed2.diffs.length, 2);

assert.equal(parsed2.diffs[0].sourceFile, 'LICENSE');
assert.equal(parsed2.diffs[0].targetFile, 'LICENSE-new');
assert.equal(parsed2.diffs[0].hunks.length, 0);

assert.equal(parsed2.diffs[1].sourceFile, 'README.md');
assert.equal(parsed2.diffs[1].targetFile, 'README-new.md');
assert.equal(parsed2.diffs[1].hunks.length, 0);


const patch3 = `From bf593d996624a4a7581ea7d97f899e1829381553 Mon Sep 17 00:00:00 2001
From: nhosh <info@nho.sh>
Date: Thu, 01 Jun 2021 19:00:44 +0200
Subject: [PATCH] Moved files

---
my/file.js | 0
my/other-file.js | 0

diff --git a/my/file.js b/my/file.js
new file mode 100644
index 00000000000..e69de29bb2d
diff --git a/my/other-file.js b/my/other-file.js
deleted file mode 100644
index 00000000000..e69de29bb2d
`;

const parsed3 = parsePatch(patch3);
assert.equal(parsed3.header.length, 206);
assert.equal(parsed3.diffs.length, 2);

assert.equal(parsed3.diffs[0].sourceFile, 'my/file.js');
assert.equal(parsed3.diffs[0].targetFile, 'my/file.js');
assert.equal(parsed3.diffs[0].hunks.length, 0);

assert.equal(parsed3.diffs[1].sourceFile, 'my/other-file.js');
assert.equal(parsed3.diffs[1].targetFile, 'my/other-file.js');
assert.equal(parsed3.diffs[1].hunks.length, 0);
