module.exports = {
	filter: async (pr) => {
		console.log(pr);
		
		// can also resolve extra metadata here
		// await pr.resolveComments();
		// await pr.resolve...();

		return true;
	},
	review: async (pr) => {
		console.log(pr);

		// await pr.resolveComments();
		// await pr.resolveFiles();
		// await pr.resolvePatch();
		// await pr.resolveReviews();
		// await pr.resolveStatus();
		
		// return [{ action: 'approve' }];
		// return [{ action: 'close' }];
		// return [{ action: 'comment', comment: 'I like this' }];
		// return [{ action: 'label', labels: ['A', 'B'] }];
		// return [{ action: 'unlabel', label: 'A'}];
		// return [{ action: 'request-changes', changes: 'This looks fuky'}];
		// return [{ action: 'review-comment', comment: 'Better change this, I mean, come-on!', path: pr.files[0], line: 1}];
		// return [{ action: 'after-review', handler: async (pr) => {
		// 	  console.log(`I have a pr? ${!!pr}`);
		// }}];
	
		// You can take multiple actions
		// return [ {}, {} ];

		return []; // do nothing
	}
}
