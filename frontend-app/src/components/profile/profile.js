import "./profile.css"

function Profile() {
    return (
    <body id="profile">
        <section>
    <div class="box1 box">
    <div class="content">
    <div class="image">
        <img src="https://i.postimg.cc/bryMmCQB/profile-image.jpg" alt="Profile Image"></img>
      </div>
      <div class="level">
        <p>PRO</p>
      </div>
      <div class="text">
        <p class="name">Lee</p>
        <p class="job_title">Game Player</p>
        <p class="job_discription">Lorem ipsum dolor sit amet consectetur adipisicing elit. Magnam atque, ipsam a amet laboriosam eligendi.</p>
      </div>
      <div class="button">
        <div>
          <button class="message" type="button">Message</button>
        </div>
        <div>
          <button class="play" type="button">Play</button>
        </div>
      </div>
    </div>
  </div>

  <div class="box2 box">
    <div class="content">
      <div class="row">
        <div class="image">
          <img src="https://i.postimg.cc/bryMmCQB/profile-image.jpg" alt="Profile Image"></img>
        </div>
        <div class="post">
          <p>RANK</p>
          <h5>1</h5>
        </div>
        <div class="win">
          <p>Games won</p>
          <h5>10</h5>
        </div>
        <div class="lose">
          <p>Games lost</p>
          <h5>2</h5>
        </div>
      </div>
      <div class="text">
        <p class="name">Lee</p>
        <p class="job_title">Game Player</p>
        <p class="about">About</p>
        <p class="job_discription">Lorem ipsum, dolor sit amet consectetur adipisicing elit. Dolores, placeat obcaecati. Eaque fugit eveniet error voluptates totam enim molestias vitae, amet aliquid deleniti ipsa ea.</p>
      </div>
    </div>
  </div>
 </section>
</body>
)
}

export default Profile;
