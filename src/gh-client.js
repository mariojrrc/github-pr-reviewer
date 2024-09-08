const { apiMethod, getJson, deleteJson, postJson, patchJson, putJson } = require('./utils.js');
const PullRequest = require('./pull-request');
const patchDiff = require('./parse-diff.js');
const parsePatch = require('./parse-patch.js');

const pageSize = {
	checks: 100,
	comments: 100,
	commits: 100,
	files: 100,
	prs: 100,
	reviews: 100,
};

const defaultOpts = {
	page: 1
};

const ghHeaders = (user, pass) => {
	const basicAuth = Buffer.from(`${user}:${pass}`).toString('base64');

	return {
		authorization: `Basic ${basicAuth}`,
		"user-agent": "curl/7.68.0"
	};
}

const processGhResponse = (response) => {
	if (response.message) {
		console.log("   GH: " + response.message);
	}

	if (response.errors) {
		console.log('Error:\n' + response.errors.join('\n'));
	}
};

const fetchPrFiles = async ({ repo, user, pass }, prID, { page = 1 } = defaultOpts) => {
	
	const headers = ghHeaders(user, pass);
	
	const pr = await getJson(
		`https://api.github.com/repos/${repo}/pulls/${prID}/files?per_page=${pageSize.files}&page=${page}`,
		{
			headers: headers
		}
	);
	processGhResponse(pr);

	return pr.map(f => f.filename);
};

const fetchPrLastCommitChecks = async ({ repo, user, pass }, commitID, { page = 1 } = defaultOpts) => {
	
	const headers = ghHeaders(user, pass);
	
	const checkRuns = await getJson(
		`https://api.github.com/repos/${repo}/commits/${commitID}/check-runs?per_page=${pageSize.checks}&page=${page}`,
		{
			headers: headers
		}
	);
	processGhResponse(checkRuns);

	return checkRuns.check_runs;
};

const fetchPrDiff = async ({ repo, user, pass }, prID) => {

	// SPEC http://git-scm.com/docs/git-format-patch
	//      https://git-scm.com/docs/diff-format
	//      http://git-scm.com/docs/git-diff
	//      https://www.gnu.org/software/diffutils/manual/html_node/Detailed-Unified.html#Detailed%20Unified
	//      https://stackoverflow.com/questions/2529441/how-to-read-the-output-from-git-diff
	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3.diff';

	const prDiff = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/pulls/${prID}`,
		headers,
		null,
		false
	);

	return prDiff;
};

const fetchPrPatch = async ({ repo, user, pass }, prID) => {

	// SPEC http://git-scm.com/docs/git-format-patch
	//      https://git-scm.com/docs/diff-format
	//      http://git-scm.com/docs/git-diff
	//      https://www.gnu.org/software/diffutils/manual/html_node/Detailed-Unified.html#Detailed%20Unified
	//      https://stackoverflow.com/questions/2529441/how-to-read-the-output-from-git-diff
	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3.patch';

	const prDiff = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/pulls/${prID}`,
		headers,
		null,
		false
	);

	return prDiff;
};

const fetchPrReviews = async ({ repo, user, pass }, prID, { page = 1 } = defaultOpts) => {

	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3+json';

	const prReviews = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/pulls/${prID}/reviews?per_page=${pageSize.reviews}&page=${page}`,
		headers,
		null,
		true
	);

	return prReviews;
};

const fetchComments = async ({ repo, user, pass }, prID, { page = 1 } = defaultOpts) => {
	const headers = ghHeaders(user, pass);
	headers["Accept"] = "application/vnd.github.v3+json";

	const prComments = await apiMethod(
		"GET",
		`https://api.github.com/repos/${repo}/issues/${prID}/comments?per_page=${pageSize.comments}&page=${page}`,
		headers,
		null,
		true
	);

	return prComments;
};

const fetchCommits = async ({ repo, user, pass }, prID, { page = 1 } = defaultOpts) => {
	const headers = ghHeaders(user, pass);
	
	const commits = await getJson(
		`https://api.github.com/repos/${repo}/pulls/${prID}/commits?per_page=${pageSize.commits}&page=${page}`,
		{
			headers: headers
		}
	);
	processGhResponse(commits);

	return commits;
};

const fetchPrStatus = async ({ repo, user, pass }, commitID) => {

	const headers = ghHeaders(user, pass);
	headers['Accept'] = 'application/vnd.github.v3+json';

	const prStatus = await apiMethod(
		'GET',
		`https://api.github.com/repos/${repo}/commits/${commitID}/status`,
		headers,
		null,
		true
	);

	return prStatus;
};

// state = open | closed | all
const listPRs = async ({ repo, user, pass }, { page = 1, state } = defaultOpts) => {
	
	if (process.env.MOCK) {
		return [];
	}
	
	const prs = await getJson(`https://api.github.com/repos/${repo}/pulls?per_page=${pageSize.prs}&page=${page}&state=${state}`, {
		headers: ghHeaders(user, pass)
	});
	processGhResponse(prs);
	
	const resultPrs = [];
	for (const pr of prs) {
		const prObj = new PullRequest({
			id: pr.id,
			url: pr.url,
			number: pr.number,
			title: pr.title,
			body: pr.body,
			labels: pr.labels,
			state: pr.state,
			locket: pr.locked,
			head: pr.head,
			base: pr.base,
			created_at: pr.created_at, // ISO timestamp, like 2022-04-20T21:25:48Z
			updated_at: pr.updated_at, // ISO timestamp, like 2022-04-20T21:25:48Z
			draft: pr.draft,
			user: {
				login: pr.user.login
			},
			commit_id: pr.head.sha
		});
		
		prObj.resolveBaseBranch = async () => {
			prObj.base_branch = await fetchBranch({ repo, user, pass }, prObj.pr.base.ref);
			prObj.resolveBaseBranch = function() {};
		};
		prObj.resolveChecks = async () => {
			const checks = await fetchPrLastCommitChecks({ repo, user, pass }, prObj.pr.head.sha, { page: prObj.resolveChecksPage });
			
			prObj.checks = [
				...(prObj.checks || []),
				...checks,
			];

			prObj.resolveChecksPage += 1;

			if (checks.length < pageSize.checks) {
				prObj.resolveChecks = function() {};
				return false; // Indicate the end was reached
			}

			return true; // Indicate more can be fetched if desired
		};
		prObj.resolveComments = async () => {
			const comments = await fetchComments({ repo, user, pass }, prObj.pr.number, { page: prObj.resolveCommentsPage });
			
			prObj.comments = [
				...(prObj.comments || []),
				...comments,
			];

			prObj.resolveCommentsPage += 1;

			if (comments.length < pageSize.comments) {
				prObj.resolveComments = function() {};
				return false; // Indicate the end was reached
			}

			return true; // Indicate more can be fetched if desired
		};
		prObj.resolveCommits = async () => {
			const commits = await fetchCommits({ repo, user, pass }, prObj.pr.number, { page: prObj.resolveCommitsPage });

			prObj.commits = [
				...(prObj.commits || []),
				...commits
			];

			prObj.resolveCommitsPage += 1;

			if (commits.length < pageSize.commits) {
				prObj.resolveCommits = function () { };
				return false; // Indicate the end was reached
			}

			return true; // Indicate more can be fetched if desired
		};
		prObj.resolveDiff = async () => {
			const diff = await fetchPrDiff({ repo, user, pass }, prObj.pr.number);
			prObj.diff = parseDiff(diff);
			prObj.resolveDiff = function () { };
		};
		prObj.resolveFiles = async () => {
			const files = await fetchPrFiles({ repo, user, pass }, prObj.pr.number, { page: prObj.resolveFilesPage });

			prObj.files = [
				...(prObj.files || []),
				...files
			];

			prObj.resolveFilesPage += 1;

			if (files.length < pageSize.files) {
				prObj.resolveFiles = function () { };
				return false; // Indicate the end was reached
			}

			return true; // Indicate more can be fetched if desired
		};
		prObj.resolvePatch = async () => {
			const patch = await fetchPrPatch({ repo, user, pass }, prObj.pr.number);
			prObj.patch = patchParser(patch);
			prObj.resolvePatch = function () { };
		};
		prObj.resolveReviews = async () => {
			const reviews = await fetchPrReviews({ repo, user, pass }, prObj.pr.number, { page: prObj.resolveReviewsPage });

			prObj.reviews = [
				...(prObj.reviews || []),
				...reviews
			];

			prObj.resolveReviewsPage += 1;

			if (reviews.length < pageSize.reviews) {
				prObj.resolveReviews = function () { };
				return false; // Indicate the end was reached
			}

			return true; // Indicate more can be fetched if desired
		};
		prObj.resolveStatus = async () => {
			prObj.status = await fetchPrStatus({ repo, user, pass }, prObj.pr.commit_id);
			prObj.resolveStatus = function () { };
		};
		
		resultPrs.push(prObj);
	}
	
	return resultPrs;
};

const approvePR = async ({ repo, user, pass }, {
	prNumber,
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		event: "APPROVE"
	};
	
	const response = await postJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const commentPR = async ({ repo, user, pass }, {
	prNumber,
	body
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		body: body
	};

	const response = await postJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}/comments`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const reviewCommentPR = async ({ repo, user, pass }, {
	prNumber,
	body,
	commit_id,
	path, // file on which the comment applies
	line, // of diff where it applies (counter in diff line numbering, starting at 1)
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		body: body,
		commit_id: commit_id,
		path: path,
		line: line,
	};
	
	const response = await postJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/comments`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const requestChanges = async ({ repo, user, pass }, {
	prNumber,
	body
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		event: 'REQUEST_CHANGES',
		body: body,
		comment: []
	};

	const response = await postJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/reviews`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const labelPR = async ({ repo, user, pass }, {
	prNumber,
	labels
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const reqData = {
		labels: labels
	};

	const response = await postJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}/labels`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

// https://docs.github.com/en/rest/pulls/pulls?apiVersion=2022-11-28#merge-a-pull-request
const mergePR = async ({ repo, user, pass }, {
	prNumber,
	method
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const response = await putJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/merge`,
		{
			merge_method: method || 'merge' // merge / squash / rebase
		},
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const closePR = async ({ repo, user, pass }, {
	prNumber
}) => {
	if (process.env.MOCK) {
		return true;
	}
	const reqData = {
		state: 'closed'
	};
	
	const response = await patchJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}`,
		reqData,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const unlabelPR = async ({ repo, user, pass }, {
	prNumber,
	label
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const response = await deleteJson(
		`https://api.github.com/repos/${repo}/issues/${prNumber}/labels/${label}`,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

const fetchBranch = async ({ repo, user, pass },
	branchName
) => {
	if (process.env.MOCK) {
		return true;
	}

	const branch = await getJson(
		`https://api.github.com/repos/${repo}/branches/${branchName}`,
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(branch);

	return branch;
};

const updateBranch = async ({ repo, user, pass }, {
	prNumber
}) => {
	if (process.env.MOCK) {
		return true;
	}

	const response = await putJson(
		`https://api.github.com/repos/${repo}/pulls/${prNumber}/update-branch`,
		{},
		{
			headers: ghHeaders(user, pass)
		}
	);

	processGhResponse(response);

	return true;
};

module.exports = {
	approvePR,
	closePR,
	commentPR,
	fetchBranch,
	fetchCommits,
	fetchComments,
	fetchPrLastCommitChecks,
	fetchPrPatch,
	labelPR,
	listPRs,
	mergePR,
	requestChanges,
	reviewCommentPR,
	unlabelPR,
	updateBranch,
};
