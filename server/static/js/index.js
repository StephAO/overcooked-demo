// Persistent network connection that will be used to transmit real-time data
var socket = io();

const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


const urlparams = new URLSearchParams(window.location.search)
const PID = urlparams.has('PROLIFIC_PID') ? urlparams.get('PROLIFIC_PID') : String(uuidv4());

/* * * * * * * * * * * * * * * * 
 * Button click event handlers *
 * * * * * * * * * * * * * * * */

$(function() {
    $('#create').click(function () {
        params = arrToJSON($('form').serializeArray());
        params.layouts = [params.layout]
        data = {
            "params" : params,
            "game_name" : "overcooked",
            "create_if_not_found" : false,
            "pid": PID
        };
        socket.emit("create", data);
        $('#waiting').show();
        $('#create').hide();
        $('#create').attr("disabled", true)
        $("#instructions").hide();
        $('#tutorial').hide();
    });
});


$(function() {
    $('#leave').click(function() {
        socket.emit('leave', {"pid": PID});
        $('#leave').attr("disabled", true);
    });
});





/* * * * * * * * * * * * * 
 * Socket event handlers *
 * * * * * * * * * * * * */

window.intervalID = -1;
window.spectating = true;

socket.on('waiting', function(data) {
    // Show game lobby
    $('#error-exit').hide();
    $('#waiting').hide();
    $('#game-over').hide();
    $('#instructions').hide();
    $('#tutorial').hide();
    $("#overcooked").empty();
    $('#lobby').show();
    $('#create').hide();
    $('#create').attr("disabled", true)
    $('#leave').show();
    $('#leave').attr("disabled", false);
});

socket.on('creation_failed', function(data) {
    // Tell user what went wrong
    let err = data['error']
    $("#overcooked").empty();
    $('#lobby').hide();
    $("#instructions").show();
    $('#tutorial').show();
    $('#waiting').hide();
    $('#create').show();
    $('#create').attr("disabled", false);
    $('#overcooked').append(`<h4>Sorry, game creation code failed with error: ${JSON.stringify(err)}</>`);
});

socket.on('start_game', function(data) {
    // Hide game-over and lobby, show game title header
    if (window.intervalID !== -1) {
        clearInterval(window.intervalID);
        window.intervalID = -1;
    }
    graphics_config = {
        container_id : "overcooked",
        start_info : data.start_info
    };
    window.spectating = data.spectating;
    $('#error-exit').hide();
    $("#overcooked").empty();
    $('#game-over').hide();
    $('#lobby').hide();
    $('#waiting').hide();
    $('#create').hide();
    $('#create').attr("disabled", true)
    $("#instructions").hide();
    $('#tutorial').hide();
    $('#leave').show();
    $('#leave').attr("disabled", false)
    $('#game-title').show();
    
    if (!window.spectating) {
        enable_key_listener();
    }
    
    graphics_start(graphics_config);
});

socket.on('reset_game', function(data) {
    graphics_end();
    if (!window.spectating) {
        disable_key_listener();
    }
    
    $("#overcooked").empty();
    $("#reset-game").show();
    setTimeout(function() {
        $("reset-game").hide();
        graphics_config = {
            container_id : "overcooked",
            start_info : data.state
        };
        if (!window.spectating) {
            enable_key_listener();
        }
        graphics_start(graphics_config);
    }, data.timeout);
});

socket.on('state_pong', function(data) {
    // Draw state update
    drawState(data['state']);
});

socket.on('end_game', function(data) {
    // Hide game data and display game-over html
    graphics_end();
    if (!window.spectating) {
        disable_key_listener();
    }
    $('#game-title').hide();
    $('#game-over').show();
    $("#create").show();
    $('#create').attr("disabled", false)
    $("#instructions").show();
    $('#tutorial').show();
    $("#leave").hide();
    $('#leave').attr("disabled", true)
    
    // Game ended unexpectedly
    if (data.status === 'inactive') {
        $('#error-exit').show();
    }
});

socket.on('end_lobby', function() {
    // Hide lobby
    $('#lobby').hide();
    $("#create").show();
    $('#create').attr("disabled", false)
    $("#leave").hide();
    $('#leave').attr("disabled", true)
    $("#instructions").show();
    $('#tutorial').show();

    // Stop trying to join
    clearInterval(window.intervalID);
    window.intervalID = -1;
})


/* * * * * * * * * * * * * * 
 * Game Key Event Listener *
 * * * * * * * * * * * * * */

function enable_key_listener() {
    $(document).on('keydown', function(e) {
        let action = 'STAY'
        switch (e.which) {
            case 37: // left
                action = 'LEFT';
                break;

            case 38: // up
                action = 'UP';
                break;

            case 39: // right
                action = 'RIGHT';
                break;

            case 40: // down
                action = 'DOWN';
                break;

            case 32: //space
                action = 'SPACE';
                break;

            default: // exit this handler for other keys
                return; 
        }
        e.preventDefault();
        socket.emit('action', { 'action' : action, "pid": PID });
    });
};

function disable_key_listener() {
    $(document).off('keydown');
};


/* * * * * * * * * * *
 * Utility Functions *
 * * * * * * * * * * */

var arrToJSON = function(arr) {
    let retval = {}
    for (let i = 0; i < arr.length; i++) {
        elem = arr[i];
        key = elem['name'];
        value = elem['value'];
        retval[key] = value;
    }
    return retval;
};

socket.once("connect", function() {
    socket.emit('server_connect', {'pid': PID})
});

socket.once("disconnect", function() {
    socket.emit('server_disconnect', {'pid': PID})
});