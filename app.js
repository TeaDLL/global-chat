let pubnub;
let username = '';

document.getElementById('joinBtn').onclick = () => {
  username = document.getElementById('username').value.trim();
  if (!username) return alert('Enter a username');

  pubnub = new PubNub({
    publishKey: "pub-c-26ce4ceb-56b4-4e05-9b4b-d3efd6ec59ad",
    subscribeKey: "sub-c-6765e36a-b6d8-4003-8a93-e94fae035608",
    uuid: username
  });

  document.getElementById('login').classList.add('hidden');
  document.getElementById('chat').classList.remove('hidden');

  pubnub.subscribe({ channels: ["global-chat"] });

  pubnub.addListener({
    message: (event) => {
      const { message, publisher } = event;
      const div = document.createElement('div');
      div.innerHTML = `<strong>${publisher}:</strong> ${message.text}`;
      document.getElementById('messages').appendChild(div);
    }
  });

  document.getElementById('send').onclick = () => {
    const text = document.getElementById('msg').value.trim();
    if (!text) return;
    pubnub.publish({ channel: "global-chat", message: { text } });
    document.getElementById('msg').value = '';
  };
};
