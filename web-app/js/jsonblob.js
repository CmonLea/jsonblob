$(function () {
    var jsonFormatterId = "json-formatter";
    var jsonEditorId = "json-editor";
    var alertsEditorId = "alerts-editor";
    var alertsformatterId = "alerts-formatter";
    var toFormatterId = "to-formatter";
    var toEditorId = "to-editor";
    var newId = "new";
    var openFileId = "open-file";
    var openUrlId = "open-url";
    var saveFileId = "save-file";
    var saveUrlId = "save-url";
    var cleanId = "clear";
    var rawUrl = "raw-json";
    var modalRawJsonUrlId = "jsonEditorUrl";
    var modalJsonEditorUrlId = "rawJsonUrl";

    var apiBase = "/api/jsonBlob";
    var blobId = window.location.pathname.substr(1);
    var sawShareModal = false;

    var defaultJson = {
        "name": "John Smith",
        "age": 32,
        "employed": true,
        "address": {
            "street": "701 First Ave.",
            "city": "Sunnyvale, CA 95125",
            "country": "United States"
        },
        "children": [
            {
                "name": "Richard",
                "age": 7
            },
            {
                "name": "Susan",
                "age": 4
            },
            {
                "name": "James",
                "age": 3
            }
        ]
    };

    var lastChangeByEditor = null;
    var editor = null;
    var formatter = null;

    // basic functions for the API
    var save = function(callback) {
        var request;
        if (!blobId) {
            request = {
                type: "POST",
                url: apiBase,
                headers: {'Content-Type': 'application/json', 'Accept':'application/json'},
                data: formatter.getText(),
                success: function(data, textStatus, jqXHR) {
                    var locationHeader = jqXHR.getResponseHeader("Location");
                    var parts = locationHeader.split("/");
                    blobId = parts[parts.length - 1];
                    $('#' + rawUrl).removeClass("hidden").show("slow");
                    if (callback && typeof(callback) == 'function') {
                        callback(data, textStatus, jqXHR)
                    }
                },
                cache: false
            };
        } else {
            var blobApiUrl = [apiBase, blobId].join("/")
            request = {
                type: "PUT",
                url: blobApiUrl,
                headers: {'Content-Type': 'application/json', 'Accept':'application/json'},
                data: formatter.getText(),
                success: function(data, textStatus, jqXHR) {
                    if (callback && typeof(callback) == 'function') {
                        callback(data, textStatus, jqXHR)
                    }
                },
                cache: false
            };
        }
        if (request) {
            $.ajax(request);
        }
    };

    var reset = function() {
        var json = {};
        formatter.set(json);
        editor.set(json);
        blobId = ""
        $('#' + rawUrl).addClass("hidden").show();
    }

    var formatterToEditor = function() {
        var error = false
        try {
            $("#" + alertsformatterId).empty();
            editor.set(formatter.get());
            if (blobId) {
                save();
            }
        } catch (err) {
            var msg = err.message.substr(0, err.message.indexOf("<a")) // remove json lint link
            $("#" + alertsformatterId).append('<div class="alert alert-block alert-error fade in"><button type="button" class="close" data-dismiss="alert">&times;</button>' + msg + '</div>');
            $("#" + alertsformatterId + ".alert").alert();
            error = true;
        }
        return error;
    };

    var editorToFormatter = function() {
        try {
            $("#" + alertsEditorId).empty();
            formatter.set(editor.get());
            if (blobId) {
                save();
            }
        } catch (err) {
            $("#" + alertsEditorId).append('<div class="alert alert-block alert-error fade in"><button type="button" class="close" data-dismiss="alert">×</button>' + err.message + '</div>');
            $("#" + alertsEditorId + ".alert").alert();
        }
    };


    var init = function() {
        // setup the formatter
        formatter = new JSONFormatter(document.getElementById(jsonFormatterId), {
            change: function () {
                lastChanged = formatter;
            }
        });

        // setup the editor
        editor = new JSONEditor(document.getElementById(jsonEditorId), {
            change: function () {
                lastChanged = editor;
            }
        });

        if (!blobId) {
            formatter.set(defaultJson)
            editor.set(defaultJson)
        } else {
            var blobApiUrl = [apiBase, blobId].join("/")
            $.getJSON(blobApiUrl, function(data) {
                formatter.set(data);
                editor.set(data);
                $('#' + rawUrl).removeClass("hidden").show();
                sawShareModal = true;
            });
        }
    }

    var saveToDisk = function() {
        var data = formatter.getText();
        var ts = (new Date()).getTime();
        $('#' + saveFileId).attr({
            "href" : "data:application/json;charset=utf-8," + encodeURIComponent(data),
            "download" : (blobId ? blobId : ts) + ".json"
        });
    }

    /* hook up the UI stuff */
    // raw JSON link
    $('#' + rawUrl).click(function() {
        if (blobId) {
            var blobApiUrl = [apiBase, blobId].join("/")
            window.open(blobApiUrl, "jsonBlob_" + blobId);
        }
    });

    // create blob link
    $('#' + saveUrlId).click(function() {
        var callback = function() {
            if (!sawShareModal) {
                var location = document.location.origin;
                $("#" + modalJsonEditorUrlId).append(location + "/" + blobId);
                $("#" + modalRawJsonUrlId).append(location + apiBase + "/" + blobId);
                $('#jsonSharedModal').modal();
                sawShareModal = true;
            }
        }
        if (!lastChangeByEditor) {
            if (!formatterToEditor()) {
                save(callback);
            }
        } else {
            editorToFormatter();
            save(callback);
        }

    });

    // download json file
    $('#' + saveFileId).click(function() {
        if (!lastChangeByEditor) {
            if (!formatterToEditor()) {
                saveToDisk();
            }
        } else {
            editorToFormatter();
            saveToDisk();
        }
    });

    // upload JSON
    $('#' + openFileId).click(function() {
        // TODO
    });

    // upload JSON
    $('#' + openUrlId).click(function() {
        // TODO
    });

    // clear the editor and formatter with either the new or clear buttons
    $("#" + cleanId + ", #" + newId).click(function() {
       reset();
    })

    // format pane to editor pane
   $("#" + toEditorId).click(function() {
       formatterToEditor();
   });

    //editor pane to format pane
    $("#" + toFormatterId).click(function() {
        editorToFormatter();
    });

    var resize = function() {
        var height = $(window).height();
        height -=  $(".navbar-fixed-top").height();
        height -=  $(".navbar-fixed-bottom").height();
        height -=  $(".controls-row").height();
        height -= 20;
        $('.editor').height(height);
    }

    $(document).ready(function(){
        resize();
        init();
    });

    $(window).resize(function() {
        resize();
    });

});
