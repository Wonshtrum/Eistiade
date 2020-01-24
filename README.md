# Eistiade
Complete package to organise AI contests.
### Installation
Clone repository, create the Database in your MySQL server by sourcing the file `db/init.sql` and create the file `db/secret.json` by following the format:
```Json
{
    "host":"YOUR_HOST",
    "user":"YOUR_USER",
    "password":"YOUR_PASSWORD",
    "database":"Eistiade",
    "interval":2000,
    "nbWorkers":8,
    "timeout":10,
    "linkPort":65000
}
```
The game played can be modified by changing the file `core/game.py` and following the example given. If necessary change the fight loop of the `core/core.py` file.

### Run
Once intalled and configured run the following lines:
```sh
cd core/
sudo python3 manager.py
cd ../web/server/
node app.js
```
If the processes are stopped, the contest can be resumed by simply rerunning these lines.
To start a new fresh contest, you can clear all datas by running the following lines:
```sh
cd db/
sudo python3 clean.py
```
