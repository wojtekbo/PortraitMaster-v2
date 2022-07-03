const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model');
const requestIp = require('request-ip');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const {title, author, email} = req.fields;
    const file = req.files.file;

    if (title.length <= 25 && author.length <= 50 && email && file) {
      // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = file.path.split('.').splice(-1)[0];

      const textPattern = /^[A-Z|a-z|0-9|_|-| ]{1,}$/;
      const validTitle = title.match(textPattern).join('');
      const validAuthor = author.match(textPattern).join('');

      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
      const validEmail = email.match(emailPattern).join('');

      if ((fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') && title === validTitle && author === validAuthor && email === validEmail) {
        const newPhoto = new Photo({title, author, email, src: fileName, votes: 0});
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else {
        throw new Error('Wrong input');
      }
    } else {
      throw new Error('Wrong input!');
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    const userIp = requestIp.getClientIp(req);
    // console.log(userIp)
    const user = await Voter.findOne({user: userIp});
    //console.log(user)
    const photoToUpdate = await Photo.findOne({_id: req.params.id});

    if (!user) {
      const newVoter = new Voter({
        user: userIp,
        votes: [photoToUpdate._id.toString()],
      });

      await newVoter.save();
      photoToUpdate.votes++;
      await photoToUpdate.save();
      res.send({message: 'OK'});
    } else {
      const photo = photoToUpdate._id.toString();
      const clickedPhoto = user.votes.indexOf(photo);

      if (clickedPhoto < 0) {
        user.votes.push(photo);
        await user.save();
        photoToUpdate.votes++;
        await photoToUpdate.save();
        res.send({message: 'ok'});
      } else {
        res.status(500).json({message: "You can't vote twice"});
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
