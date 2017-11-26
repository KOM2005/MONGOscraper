$(document).ready(function() {

	$(document).on("click", ".delete", deleteStory);
	$(document).on("click", ".notes", storyNotes);
	$(document).on("click", ".savenote", saveNotes);
	$(document).on("click", ".note-delete", deleteNote);


	function deleteNote(){

		var note={
			noteId: $(this).parent().attr("id"),
			storyId: $("h4").attr("id")
		};

		$.ajax("/deleteNote",{
			//async: false,
			type: "POST",
			data: note
		});

		$(this).parent().parent().remove();
	}



	function saveNotes(){

		var note = {
			id: $(".modal-title").attr("id"),
			comment: $("textarea").val().trim()
		};

		//while(note.comment.length < 3){alert ("Comment should be contain at least 3 symbols");}

		$.ajax({
			//async: false,
			method: "POST",
			url: "/api/saveNote",
			data: note
		})

	}


	function deleteStory(){

		var story = {id: $(this).parent().parent().parent().attr("id")};

		$(this).parent().parent().parent().remove();

		$.ajax("/deleteStory", {
			//async: false,
			type: "POST",
			data: story,
			success: setTimeout(function(){
				location.reload();
			},1000)
		});

	}


	function storyNotes(){
		$(".list-group").remove();
		var story = {
			id: $(this).parent().parent().parent().attr("id")
		};
		$.ajax("/api/notes", {
			type: "PUT",
			data: story
		}).done(function(data){
			$(".modal-title").text("Notes for story: " + data.title).attr("id", data._id);
			//$("textarea").empty();
			console.log(data.note.length);
			if(data.note){
				if(data.note.length == 0){
					var listContainer = $("<ul>");
				    listContainer.addClass("list-group note-container");
				    var noteItem = $("<li>");
				    noteItem.addClass("list-group-item");
				    //noteItem.attr("id", data.note[i]._id);
				    noteItem.text("There are no any notes for this article");
				    listContainer.append(noteItem);
				    listContainer.appendTo($(".modal-body"));	
				} else {
					for(var i = 0; i < data.note.length; i++){
						var listContainer = $("<ul>");
					    listContainer.addClass("list-group note-container");
					    var noteItem = $("<li>");
					    noteItem.addClass("list-group-item note");
					    noteItem.attr("id", data.note[i]._id);
					    noteItem.text(data.note[i].comment);
					    //console.log("Note: ",data.note);
					    var noteButton = $("<button>");
					    noteButton.addClass("btn btn-danger note-delete");
					    noteButton.text("X");

					    noteItem.append(noteButton);
					    listContainer.append(noteItem);

					    listContainer.appendTo($(".modal-body"));			
					}				
				}

				
			}
			console.log(data.note);

		});
	}

});