$(document).ready(function() {


	$("#scrapeStories").on("click", getStories);
	$(".save").on("click", saveStory);

	function saveStory(){

		var story = {
			title: $(this).prev().text(),
			link: $(this).prev().attr("href"),
			summary: $(this).parent().parent().next().text()
		};

		$(this).parent().parent().parent().remove();

		$.ajax("/saveStory", {
			type: "POST",
			data: story,
			success: setTimeout(function(){
				location.reload();
			},1000)
		});

	}

	function getStories() {
		//$("myModal").modal("hide");
		$.ajax("api/scrape", {
			async: false,
			type: "GET",
			success: setTimeout(function(){
				//res.json(222);
				location.reload();
			},2000)
		})

	}


});
