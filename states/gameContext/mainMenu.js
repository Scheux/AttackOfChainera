import { GameContext } from "../../gameContext.js";
import { State } from "../../source/state/state.js";

const MAIN_MENU_ID = "MAIN_MENU";

export const MainMenuState = function() {
    State.call(this);
}

MainMenuState.prototype = Object.create(State.prototype);
MainMenuState.prototype.constructor = MainMenuState;

MainMenuState.prototype.enter = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, renderer, client } = gameContext;
    const { musicPlayer } = client;

    musicPlayer.loadTrack("surfing");

    uiManager.parseUI("MAIN_MENU", gameContext);
    uiManager.addFetch("TEXT_FPS", element => element.setText(`FPS: ${Math.floor(renderer.smoothedFPS)}`));
    uiManager.addClick("BUTTON_PLAY", () => stateMachine.setNextState(GameContext.STATE_PLAY_GAME));
    uiManager.addClick("BUTTON_EDIT", () => stateMachine.setNextState(GameContext.STATE_MAP_EDITOR));
}

MainMenuState.prototype.exit = function(stateMachine) {
    const gameContext = stateMachine.getContext();
    const { uiManager, client } = gameContext;
    const { musicPlayer } = client;

    musicPlayer.swapTrack("surfing", 0.1);
    uiManager.unparseUI("MAIN_MENU", gameContext);
}