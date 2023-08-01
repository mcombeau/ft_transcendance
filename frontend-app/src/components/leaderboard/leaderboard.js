import "./leaderboard.css"

function Leaderboard() {
    return (
    <body id="lead">
        <main>
        <div id="header">
            <h1>Game Ranking</h1>
        </div>
        <div id="leaderboard">
            <div class="ribbon"></div>
            <table>
            <tr>
                <td class="number">1</td>
                <td class="name">Lee</td>
                <td class="points">
                258.244 <img class="gold-medal" src="https://github.com/malunaridev/Challenges-iCodeThis/blob/master/4-leaderboard/assets/gold-medal.png?raw=true" alt="gold medal"/>
                </td>
            </tr>
            <tr>
                <td class="number">2</td>
                <td class="name">Mark</td>
                <td class="points">258.242</td>
            </tr>
            <tr>
                <td class="number">3</td>
                <td class="name">Fran</td>
                <td class="points">258.223</td>
            </tr>
            <tr>
                <td class="number">4</td>
                <td class="name">Sara</td>
                <td class="points">258.212</td>
            </tr>
            <tr>
                <td class="number">5</td>
                <td class="name">John</td>
                <td class="points">258.208</td>
            </tr>
            </table>
            <div id="buttons">
            <button class="exit">back</button>
            <button class="continue">More</button>
            </div>
        </div>
        </main>
    </body>
    )
};

export default Leaderboard;
