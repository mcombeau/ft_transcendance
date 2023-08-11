import "./profile.css"

function Profile() {
    return (
    <div id="profile">
        <section>
    <div className="box1 box">
    <div className="content">
    <div className="image">
        <img src="https://i.postimg.cc/bryMmCQB/profile-image.jpg" alt="Profile Image"></img>
      </div>
      <div className="level">
        <p>PRO</p>
      </div>
      <div className="text">
        <p className="name">Lee</p>
        <p className="job_title">Game Player</p>
        <p className="job_discription">Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam atque, ipsam a amet laboriosam eligendi.</p>
      </div>
      <div className="button">
        <div>
          <button className="message" type="button">Message</button>
        </div>
        <div>
          <button className="play" type="button">Play</button>
        </div>
      </div>
    </div>
  </div>

  <div className="box2 box">
    <div className="content">
      <div className="row">
        <div className="image">
          <img src="https://i.postimg.cc/bryMmCQB/profile-image.jpg" alt="Profile Image"></img>
        </div>
        <div className="post">
          <p>RANK</p>
          <h5>1</h5>
        </div>
        <div className="win">
          <p>Games won</p>
          <h5>10</h5>
        </div>
        <div className="lose">
          <p>Games lost</p>
          <h5>2</h5>
        </div>
      </div>
      <div className="text">
        <p className="name">Lee</p>
        <p className="job_title">Game Player</p>
        <p className="about">About</p>
        <p className="job_discription">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolores, placeat obcaecati. Eaque fugit eveniet error voluptates totam enim molestias vitae, amet aliquid deleniti ipsa ea.</p>
      </div>
    </div>
  </div>
 </section>
</div>
)
}

export default Profile;
