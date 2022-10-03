// Persistent network connection that will be used to transmit real-time data
var socket = io();

var config;

var round = 0;

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));


const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

var agents = [];
var layouts = [];
var human_color = 'blue'
var agent_colors = {}

// Read in game config provided by server
$(function() {
    config = JSON.parse($('#config').text());
    console.log(config)
    for(i = 0; i < config['agents'].length; i++) {
        agent_colors[config['agents'][i]] = config['non_human_colors'][i]
    }
    agent_layouts = cartesian(config['agents'], config['layouts']);
    let copy_al = agent_layouts.slice()
    console.log(copy_al);
    shuffleArray(agent_layouts);
    console.log(agent_layouts);
    $('#quit').show();
});

/* * * * * * * * * * * * * * * * 
 * Button click event handlers *
 * * * * * * * * * * * * * * * */
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
        window.location.href = "./ranking";
    });
});

$(function() {
    $('#next-round').click(function() {
        // Config for this specific game
        let data = {
            "params" : {
                "playerZero" : "human",
                "playerOne" : agent_layouts[round][0],
                "layouts" : [agent_layouts[round][1]],
                "gameTime" : 10,
                "randomized" : false
            },
            "game_name" : "overcooked"
        };
        $('#next-round').hide();
        setAgentColors({0: human_color, 1: agent_colors[agent_layouts[round][0]]},)
        // create (or join if it exists) new game
        socket.emit("create", data);
    });
});

const form = document.querySelector("form");
$(function() {
    $( "form" ).submit(function(event) {
        event.preventDefault();
        console.log(event)
        for(i = 1; i <= 10; i++) {
            var ele = document.getElementsByName(`s${i}`);

            for(j = 0; j < ele.length; j++) {
                if(ele[j].checked)
                console.log('$', `s${i}`, ele[j].value)
            }
        }

        round++;
        if (round >= agent_layouts.length) {
            $('#next-round').hide();
            // TODO end stuff here
        } else {
            console.log('ready for next round?')
            $('#survey-container').hide();
            $('#next-round').text(`Start Next Round ${round + 1}/${agent_layouts.length}`);
            $('#next-round').show();
        }
    });
});


/* * * * * * * * * * * * * 
 * Socket event handlers *
 * * * * * * * * * * * * */

socket.on('creation_failed', function(data) {
    // Tell user what went wrong
    let err = data['error']
    $("#overcooked").empty();
    $('#overcooked').append(`<h4>Sorry, game creation code failed with error: ${JSON.stringify(err)}</>`);
    $('#try-again').show();
    $('#try-again').attr("disabled", false);
});

socket.on('start_game', function(data) {
    console.log('Game start done')
    graphics_config = {
        container_id : "overcooked",
        start_info : data.start_info
    };
    $("#overcooked").empty();
    $('#game-over').hide();
    $('#next-round').hide();
    $('#game-title').text(`Round ${round + 1} / ${agent_layouts.length}`);
    $('#game-title').show();
    $('#survey-container').hide();
    $('#overcooked-container').show();
    enable_key_listener();
    graphics_start(graphics_config);
    console.log('Game start done')
});

//socket.on('reset_game', function(data) {
//    round++;
//    graphics_end();
//    disable_key_listener();
//    $("#overcooked").empty();
//    $('#game-title').text(`Round ${round + 1} / ${config['num_rounds']}`);
//
//    graphics_config = {
//        container_id : "overcooked",
//        start_info : data.state
//    };
//    graphics_start(graphics_config);
//    enable_key_listener();
//});

socket.on('state_pong', function(data) {
    // Draw state update
    drawState(data['state']);
});

socket.on('end_game', function(data) {
    console.log("Game ended")
    $('#game-title').hide();
    // Hide game data and display game-over html
    graphics_end();
    disable_key_listener();
//    $('#game-title').hide();
//    $('#quit').hide();
    
    if (data.status === 'inactive') {
        // Game ended unexpectedly
        $('#error-exit').show();
        // Propogate game stats to parent window with psiturk code
        window.top.postMessage({ name : "error" }, "*");
    } else {
        // Propogate game stats to parent window with psiturk code
        window.top.postMessage({ name : "tutorial-done" }, "*");
    }
    $('#overcooked-container').hide();
    $('#survey-container').show();
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
    $('#next-round').text(`Start Next Round ${round + 1}/${agent_layouts.length}`);
    $('#next-round').show();
    $('#game-title').text(`Round ${round + 1} / ${agent_layouts.length}`);
    $('#game-title').show();
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