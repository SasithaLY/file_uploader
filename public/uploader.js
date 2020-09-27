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

function retrieve(folder) {
  breadcrumbs.push({ id: $(folder).attr("id"), name: $(folder).data("id") });
  getFiles($(folder).attr("id"));
}

function getFolder(folder) {
  let index = breadcrumbs.findIndex((obj) => obj.id === folder);
  breadcrumbs.length = index + 1;
  getFiles(folder);
}

function getFiles(folder) {
  var base_url = window.location.origin;
  $("#fileLoader").show();
  $.ajax({
    type: "GET",
    url: base_url + "/getfiles",
    headers: {
      "Content-Type": "application/json",
    },
    data: { parent: folder },
    error: function (request, status, error) {
      console.log(request.responseText);
      window.location.reload();
    },
    success: function (data) {
      $("#fileLoader").hide();
      if (data) {
        let parents = "";
        $.each(breadcrumbs, function (i, item) {
          if (i === breadcrumbs.length - 1) {
            parents += ' <button onclick="getFolder(`' + item.id + '`);" class="btn btn-sm btn-outline-success">' + item.name + "</button>  ";
          } else {
            parents += ' <button onclick="getFolder(`' + item.id + '`);" class="btn btn-sm btn-outline-success">' + item.name + "</button> > ";
          }
        });
        $("#breadcrumbs").html(parents);

        if (data.error) {
          let st = '<span style="color:red;">' + data.error + "</span>";
          $("#files").html(st);
        } else {
          setFiles(data.files);
        }
      }
    },
  });
}

function setFiles(data) {
  let st = "";

  $.each(data, function (i, item) {
    if (item.mimeType.includes("folder")) {
      st +=
        '<a href="#" onclick="retrieve(this);" data-id="' +
        item.name +
        '" id="' +
        item.id +
        '"><li class="d-flex  align-items-center item"><img width="40" height="auto" src="./folder.png">' +
        item.name +
        "</li></a>";
    } else {
      st +=
        '<li class="d-flex justify-content-between align-items-center item" >' +
        item.name +
        '<div><a onclick="deleteFile(`' +
        item.id +
        '`)" href="#"><i class="fas fa-trash-alt mx-2 delete"></i></a>' +
        '<a  id="' +
        item.id +
        '" data-id="' +
        item.name +
        '" href="/download/' +
        item.id +
        "/" +
        item.name +
        '" target="_blank"><i class="fas fa-download download"></i></a>' +
        "</div></li>";
    }
  });

  $("#files").html(st);
}

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


