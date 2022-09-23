// Persistent network connection that will be used to transmit real-time data
var socket = io();



var config;

var curr_tutorial_phase;

// Read in game config provided by server
$(function() {
    config = JSON.parse($('#config').text());
    $('#quit').show();
});

/* * * * * * * * * * * * * * * * 
 * Button click event handlers *
 * * * * * * * * * * * * * * * */

$(function() {
    $('#try-again').click(function () {
        data = {
            "params" : config['tutorialParams'],
            "game_name" : "tutorial"
        };
        socket.emit("join", data);
        $('try-again').attr("disable", true);
    });
});

$(function() {
    $('#quit').click(function() {
        socket.emit("leave", {});
        $('quit').attr("disable", true);
        window.location.href = "./";
    });
});

$(function() {
    $('#finish').click(function() {
        $('finish').attr("disable", true);
        window.location.href = "./";
    });
});



/* * * * * * * * * * * * * 
 * Socket event handlers *
 * * * * * * * * * * * * */

socket.on('creation_failed', function(data) {
    // Tell user what went wrong
    let err = data['error']
    $("#overcooked").empty();
    $('#overcooked').append(`<h4>Sorry, tutorial creation code failed with error: ${JSON.stringify(err)}</>`);
    $('#try-again').show();
    $('#try-again').attr("disabled", false);
});

socket.on('start_game', function(data) {
    curr_tutorial_phase = 0;
    graphics_config = {
        container_id : "overcooked",
        start_info : data.start_info
    };
    $("#overcooked").empty();
    $('#game-over').hide();
    $('#try-again').hide();
    $('#try-again').attr('disabled', true)
    $('#hint-wrapper').hide();
    $('#show-hint').text('Show Hint');
    $('#game-title').text(`Tutorial in Progress, Phase ${curr_tutorial_phase}/${tutorial_instructions.length}`);
    $('#game-title').show();
    $('#tutorial-instructions').append(tutorial_instructions[curr_tutorial_phase]);
    $('#instructions-wrapper').show();
    $('#hint').append(tutorial_hints[curr_tutorial_phase]);
    enable_key_listener();
    graphics_start(graphics_config);
});

socket.on('reset_game', function(data) {
    curr_tutorial_phase++;
    graphics_end();
    disable_key_listener();
    $("#overcooked").empty();
    $('#tutorial-instructions').empty();
    $('#hint').empty();
    $("#tutorial-instructions").append(tutorial_instructions[curr_tutorial_phase]);
    $("#hint").append(tutorial_hints[curr_tutorial_phase]);
    $('#game-title').text(`Tutorial in Progress, Phase ${curr_tutorial_phase + 1}/${tutorial_instructions.length}`);
    
    let button_pressed = $('#show-hint').text() === 'Hide Hint';
    if (button_pressed) {
        $('#show-hint').click();
    }
    graphics_config = {
        container_id : "overcooked",
        start_info : data.state
    };
    graphics_start(graphics_config);
    enable_key_listener();
});

socket.on('state_pong', function(data) {
    // Draw state update
    drawState(data['state']);
});

socket.on('end_game', function(data) {
    // Hide game data and display game-over html
    graphics_end();
    disable_key_listener();
    $('#game-title').hide();
    $('#instructions-wrapper').hide();
    $('#hint-wrapper').hide();
    $('#show-hint').hide();
    $('#game-over').show();
    $('#quit').hide();
    
    if (data.status === 'inactive') {
        // Game ended unexpectedly
        $('#error-exit').show();
        // Propogate game stats to parent window with psiturk code
        window.top.postMessage({ name : "error" }, "*");
    } else {
        // Propogate game stats to parent window with psiturk code
        window.top.postMessage({ name : "tutorial-done" }, "*");
    }

    $('#finish').show();
});


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
        socket.emit('action', { 'action' : action });
    });
};

function disable_key_listener() {
    $(document).off('keydown');
};

/* * * * * * * * * * * * 
 * Game Initialization *
 * * * * * * * * * * * */

socket.on("connect", function() {
    // Config for this specific game
    let data = {
        "params" : config['tutorialParams'],
        "game_name" : "tutorial"
    };

    // create (or join if it exists) new game
    socket.emit("join", data);
});


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