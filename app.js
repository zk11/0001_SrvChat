var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)
    fs = require('fs'),
	edge=require('edge');

//requête d'enregistrement 
/*
saisir la connexion en ligne de commande
set EDGE_SQL_CONNECTION_STRING=Data Source=SCZC529107V\ESIAMBDD;Integrated Security=True
*/
var RegMessage = edge.func('sql', function(){/*
	insert into donnees.dbo.Message select @user,@msg,getdate()
*/});

var user;
var msg;

// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/chat.html');
});

io.sockets.on('connection', function (socket, pseudo) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
	
    socket.on('nouveau_client', function(pseudo) {
        pseudo = ent.encode(pseudo);
        socket.pseudo = pseudo;
        socket.broadcast.emit('nouveau_client', pseudo);
		console.log('Nouveau client : '+pseudo);
		//var ip = socket.client.request.headers['x-forwarded-for'] || socket.client.conn.remoteAddress || socket.conn.remoteAddress || socket.request.connection.remoteAddress;
		var ip= socket.request.connection.remoteAddress;
		console.log('Adresse Ip : ' +ip);
    });

	// déconnexion
	socket.on('disconnect', function() { 
		user=socket.pseudo;   	
		socket.broadcast.emit('ancien_client', user);
		console.log('Depart client : '+user);
	});
	
    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
        message = ent.encode(message);
        socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
		user=socket.pseudo;//stock le pseudo dans la variable
		msg=message;//stock le messager dans la variable
		
		/*mise en forme des caractère spéciaux*/
		var hat=/&Hat;/gi;
		var apos=/&apos;/gi;
		var ecirc=/&ecirc;/gi;
		var eacute=/&eacute;/gi;
		var egrave=/&egrave;/gi;
		var agrave=/&agrave;/gi;
		var bsol=/&bsol;/gi;
		var lpar=/&lpar;/gi;
		var rpar=/&rpar;/gi;
		var equest=/&quest;/gi;
		var excl=/&excl;/gi;
		var comma=/&comma;/gi;
		var ccedil=/&ccedil;/gi;
		
		msg=msg.replace(apos,"'");
		msg=msg.replace(hat,"^");
		msg=msg.replace(ecirc,"e");
		msg=msg.replace(eacute,"e");
		msg=msg.replace(egrave,"e");
		msg=msg.replace(agrave,"a");
		msg=msg.replace(bsol,"\\");
		msg=msg.replace(lpar,"(");
		msg=msg.replace(rpar,")");
		msg=msg.replace(equest,"?");
		msg=msg.replace(excl,"!");
		msg=msg.replace(comma,",");
		msg=msg.replace(ccedil,"ç");
		
		
		RegMessage({"user": user,"msg":msg}, function(error,result){//remplace @user par la valeur de la variable user, idem pour msg
			if(error)throw error;
			//console.log(msg);
			//console.log(result[2].code);//affiche le 3eme résultat (commence a 0) de la colonne code
		});
    }); 
		
	
});


server.listen(8080);