//let parents = '<button class="btn btn-sm btn-outline-primary">Drive</button>';

let breadcrumbs = [{ id: "root", name: "Drive" }];
$(document).ready(function () {
  getFiles("root");
  $("#success").hide();
  $(document).on("click", function (e) {
    if (e.target) {
      // if (e.target.id == "btnSearch") {
      // }
    }
  });

  $("#files li").on("click", function () {
    //  ret = DetailsView.GetProject($(this).attr("#data-id"), OnComplete, OnTimeOut, OnError);
    console.log($(this).attr("data-id"));
    breadcrumbs.push({ id: $(this).attr("id"), name: $(this).attr("data-id") });
    //getFiles(`${$(this).attr("id")}`);
  });
});

function retrieve(folder) {
  breadcrumbs.push({ id: $(folder).attr("id"), name: $(folder).data("id") });
  getFiles($(folder).attr("id"));
}

function getFolder(folder) {
  let index = breadcrumbs.findIndex(obj => obj.id === folder);
  breadcrumbs.length = index + 1;
  getFiles(folder);
}

function getFiles(folder) {
  var base_url = window.location.origin;

  $.ajax({
    type: "GET",
    url: base_url + "/getfiles",
    headers: {
      "Content-Type": "application/json",
    },
    data: { parent: folder },
    success: function (data) {
      console.log(data);
      if (data.error) {
      } else {
        let parents = "";
        $.each(breadcrumbs, function (i, item) {
          console.log(item.id);
          if(i === breadcrumbs.length-1){
            parents += ' <button onclick="getFolder(`' + item.id + '`);" class="btn btn-sm btn-outline-success">' + item.name + '</button>  ';
          }else{
            parents += ' <button onclick="getFolder(`' + item.id + '`);" class="btn btn-sm btn-outline-success">' + item.name + '</button> > ';
          }
          
        });
        $("#breadcrumbs").html(parents);

        setFiles(data.files);
      }
    },
  });
}

function setFiles(data) {
  let st = "";

  $.each(data, function (i, item) {
    if (item.mimeType.includes("folder")) {
      st +=
        '<a href="#" onclick="retrieve(this);" data-id="'+item.name+'" id="'+item.id+'"><li class="item"><img width="40" height="auto" src="./folder.png">' +
        item.name +
        "</li></a>";
    } else {
      st += '<li class="item" >' + item.name + "</li>";
    }
  });

  $("#files").html(st);
}

function upload() {
  $("#btnUpload").prop("disabled", true);
  var base_url = window.location.origin;
  var data = new FormData();
  var file = document.getElementById("file").files[0];
  data.append("file", file);
  data.append("folder", breadcrumbs[breadcrumbs.length-1].id);

  //console.log(data.getAll("folder"));
  $.ajax({
    type: "POST",
    url: base_url + "/upload",
    data: data,
    processData: false,
    contentType: false,
    cache: false,
    async: true,
    success: function (data) {
      console.log(data);
      $("#btnUpload").prop("disabled", false);
      if (data) {
        showSuccess();
        getFolder(breadcrumbs[breadcrumbs.length-1].id);
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
