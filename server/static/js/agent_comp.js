// Persistent network connection that will be used to transmit real-time data
var socket = io();

var config = JSON.parse($('#config').text());

var bonus_per_dish = 0.03;
var curr_agent_idx = 0;
var curr_layout_idx = -1;
var round_num = -1
var tot_rounds = -1
var round_score = -1;
var tot_soups_served = 0;
var agent_order = [];
var layout_order = [];
var name_to_color = {};
var color_to_name = {};
var human_color = 'blue';
var layout_order_has_been_set = false;

const uuidv4 = () => {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}


const params = new URLSearchParams(window.location.search)
const PID = params.has('PROLIFIC_PID') ? params.get('PROLIFIC_PID') : String(uuidv4());
const STUDY_ID = params.has('STUDY_ID') ? params.get('STUDY_ID') : 'None';
const SESS_ID = params.has('SESSION_ID') ? params.get('SESSION_ID') : 'None';

console.log(PID, STUDY_ID, SESS_ID)

for(i = 0; i < config['agents'].length; i++) {
    name_to_color[config['agents'][i]] = (config['non_human_colors'][i]);
    color_to_name[config['non_human_colors'][i]] = config['agents'][i];
}
console.log(name_to_color);

const cartesian = (...a) => a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

const set_layout_order = () => {
    layout_order = config['layouts'];
    shuffleArray(layout_order);
    console.log(layout_order);
};

const setup_next_round = () => {
    curr_agent_idx++;
    if (curr_agent_idx >= agent_order.length) {
        agent_order = config['agents'];
        shuffleArray(agent_order);
        curr_agent_idx = 0;
        curr_layout_idx++;
        for (let i = 1; i <= 5; i++) {
            el_id = `#agent-${i+1}`;
            $(el_id).hide();
        }
        $('#new-layout').text(`New Layout (${curr_layout_idx + 1}/${layout_order.length})!`);
        $('#new-layout').show();
    }
    $("#teammate-img").attr('src', `\static/assets/${name_to_color[agent_order[curr_agent_idx]]}_chef.png`);
    $('#teammate-desc').text(`This is ${name_to_color[agent_order[curr_agent_idx]]} chef. They will be your teammate for the next round.`);

    round_num = curr_layout_idx * config['layouts'].length + curr_agent_idx + 1;
    tot_rounds = config['agents'].length * config['layouts'].length;

    console.log("SNR", curr_layout_idx, layout_order.length, '-', curr_agent_idx, agent_order.length)
    $("#rankingElement").hide();
    $('#agents-ordering').hide();
    if (curr_layout_idx < layout_order.length) {
        $('#game-title').text(`Round ${round_num} / ${tot_rounds}`);
        $('#game-title').show();
        $('#agents-imgs').show();
        $('#start-next-round').text(`Start Next Round`);
        $('#start-next-round').show();
    }
};


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
    $('#start-next-round').click(function() {
        // Config for this specific game
        let data = {
            "params" : {
                "playerZero" : "human",
                "playerOne" : agent_order[curr_agent_idx],
                "layouts" : [layout_order[curr_layout_idx]],
                "gameTime" : 4,
                "randomized" : false,
            },
            "game_name" : "overcooked",
            "pid": PID
        };
        $('#start-next-round').hide();
        console.log("agent images should be hidden")
        $('#agents-imgs').hide();
        $('#new-layout').hide()
        setAgentColors({0: human_color, 1: name_to_color[agent_order[curr_agent_idx]]})
        // create (or join if it exists) new game
        socket.emit("create", data);
        $('#overcooked-container').show();
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
    graphics_config = {
        container_id : "overcooked",
        start_info : data.start_info
    };
    $("#overcooked").empty();
    $('#game-over').hide();
    $('#start-next-round').hide();
    $('#game-title').text(`Round ${round_num} / ${tot_rounds}`);
    $('#game-title').show();
    $('#surveyElement').hide();
    $('#overcooked-container').show();
    $('#agents-imgs').hide();
    enable_key_listener();
    graphics_start(graphics_config);
});

socket.on('state_pong', function(data) {
    // Draw state update
    drawState(data['state']);
});

socket.on('end_game', function(data) {
//    $('#game-title').hide();
    // Hide game data and display survey html
    graphics_end();
    disable_key_listener();
    round_score = data['data'].score;
    tot_soups_served += (round_score / 20)
    human_sb_comp = data['data'].subtask_completion;

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
    console.log("Should show survey container")
    $('#surveyElement').show();
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
        socket.emit('action', { 'action' : action, 'pid': PID});
    });
};

function disable_key_listener() {
    $(document).off('keydown');
};


/* * * * * * * * * * * * 
 * Game Initialization *
 * * * * * * * * * * * */

socket.once("connect", function() {
    if (!layout_order_has_been_set) {
        set_layout_order();
        layout_order_has_been_set = true;
        setup_next_round();
        socket.emit('server_connect', {'pid': PID})
    }
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