// Persistent network connection that will be used to transmit real-time data
var socket = io();

const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


const params = new URLSearchParams(window.location.search)
const PID = params.has('PROLIFIC_PID') ? params.get('PROLIFIC_PID') : String(uuidv4());

var config;

var tutorial_instructions = () => [
    `
    <p>
    Your goal is to cook and deliver soups in order to earn reward. <br>
    Notice how your partner is busily churning out soups. <br>
    See if you can copy his actions in order to cook and deliver the a soup.<br>
    <b>You will advance only when you have delivered the appropriate soup</b><br>
    </p>
    <p>Good luck!</p>
    `,
];

var curr_tutorial_phase;

// Read in game config provided by server
$(function() {
    config = JSON.parse($('#config').text());
    tutorial_instructions = tutorial_instructions();
    $('#quit').show();
});

/* * * * * * * * * * * * * * * * 
 * Button click event handlers *
 * * * * * * * * * * * * * * * */

$(function() {
    $('#try-again').click(function () {
        data = {
            "params" : config['tutorialParams'],
            "game_name" : "tutorial",
            "pid": PID
        };
        socket.emit("join", data);
        $('try-again').attr("disable", true);
    });
});

$(function() {
    $('#quit').click(function() {
        socket.emit("leave", {"pid": PID});
        $('quit').attr("disable", true);
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
    $('#game-title').text(`Tutorial in Progress`);
    $('#game-title').show();
    $('#tutorial-instructions').append(tutorial_instructions[curr_tutorial_phase]);
    $('#instructions-wrapper').show();
    enable_key_listener();
    graphics_start(graphics_config);
});

socket.on('state_pong', function(data) {
    // Draw state update
    drawState(data['state']);
});

socket.on('end_game', function(data) {
    // Hide game data and display game-over html
    graphics_end();
    disable_key_listener();
//    $('#game-title').hide();
    $('#instructions-wrapper').hide();
    $('#overcooked-container').hide();
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
        socket.emit('action', { 'action' : action, "pid": PID });
    });
};

function disable_key_listener() {
    $(document).off('keydown');
};

/* * * * * * * * * * * * 
 * Game Initialization *
 * * * * * * * * * * * */

socket.once("connect", function() {
    // Config for this specific game
    let data = {
        "params" : config['tutorialParams'],
        "game_name" : "tutorial",
        "pid": PID
    };
    socket.emit('server_connect', {'pid': PID})

    $('#finish').hide();

    // create (or join if it exists) new game
    socket.emit("join", data);
});

socket.once("disconnect", function() {
    socket.emit('server_disconnect', {'pid': PID})
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
