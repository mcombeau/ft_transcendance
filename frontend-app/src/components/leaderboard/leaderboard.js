import "./leaderboard.css"

function Leaderboard() {
    return (
    <main>
        <div id="lead" >
        <div id="header">
            <h1>Game Ranking</h1>
        </div>
        <div id="leaderboard">
            <div className="ribbon"></div>
            <table>
                <tbody>
                    <tr>
                        <td className="number">1</td>
                        <td className="name">Lee</td>
                        <td className="points">
                        258.244 <img className="gold-medal" src="https://github.com/malunaridev/Challenges-iCodeThis/blob/master/4-leaderboard/assets/gold-medal.png?raw=true" alt="gold medal"/>
                        </td>
                    </tr>
                    <tr>
                        <td className="number">2</td>
                        <td className="name">Mark</td>
                        <td className="points">258.242</td>
                    </tr>
                    <tr>
                        <td className="number">3</td>
                        <td className="name">Fran</td>
                        <td className="points">258.223</td>
                    </tr>
                    <tr>
                        <td className="number">4</td>
                        <td className="name">Sara</td>
                        <td className="points">258.212</td>
                    </tr>
                    <tr>
                        <td className="number">5</td>
                        <td className="name">John</td>
                        <td className="points">258.208</td>
                    </tr>
                </tbody>
            </table>
            <div id="buttons">
            <button className="exit">back</button>
            <button className="continue">More</button>
            </div>
        </div>
    </div>
    </main>
    )
};

export default Leaderboard;
