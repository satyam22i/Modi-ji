import "./App.css";
import GameCanvas from "./GameCanvas";

export default function App() {
  return (
    <div>
      <div className="score" id="scoreDisplay">
        Score: <span id="score">0</span>
      </div>
      <GameCanvas />
      <div className="message" id="message">
        Game Over 😅
        <br />
        Click or press Space to Restart
      </div>
    </div>
  );
}
