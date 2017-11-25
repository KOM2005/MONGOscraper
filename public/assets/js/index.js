$(document).on("click", "#scrapeStories", getStories);
$(document).on("click", ".save", saveStory);

function saveStory(){

	var story = {
		title: $(this).prev().text(),
		link: $(this).prev().attr("href"),
		summary: $(this).parent().parent().next().text()
	};

	$.ajax("/saveStory", {
		type: "POST",
		data: story
	});

	$(this).parent().parent().parent().remove();

}

function getStories() {
	
	$.ajax("api/scrape", {
		type: "GET",
		success: location.href = "/"
	});

}

