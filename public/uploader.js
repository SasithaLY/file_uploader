let breadcrumbs = [{ id: "root", name: "Drive" }];

$(document).ready(function () {
  getFiles("root");
  $("#success").hide();
  $(document).on("click", function (e) {
    if (e.target) {
      if (e.target.id == "btnUpload") {
        if ($("#file").val() != "") {
          $("#error").hide();
          upload();
        } else {
          $("#error").show();
        }
      }
    }
  });
});



function upload() {
  $("#loader").show();
  $("#btnUpload").prop("disabled", true);
  var base_url = window.location.origin;
  var data = new FormData();
  var file = document.getElementById("file").files[0];
  data.append("file", file);
  data.append("folder", breadcrumbs[breadcrumbs.length - 1].id);

  $.ajax({
    type: "POST",
    url: base_url + "/upload",
    data: data,
    processData: false,
    contentType: false,
    cache: false,
    async: true,
    timeout: 600000,
    error: function (request, status, error) {
      console.log(request.responseText);
      window.location.reload();
    },
    success: function (data) {
      console.log(data);
      $("#btnUpload").prop("disabled", false);
      $("#loader").hide();
      if (data) {
        $("#uploadForm").trigger("reset");
        showSuccess();
        getFolder(breadcrumbs[breadcrumbs.length - 1].id);
      }
    },
  });
}

function showSuccess() {
  let st =
    '<div class="alert alert-success alert-dismissible fade show" id="success" role="alert">' +
    "<strong>Success!</strong> File has been uploaded to the drive." +
    '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
    '<span aria-hidden="true">&times;</span>' +
    "</button>" +
    "</div>";

  $("#successMsg").html(st);
}


