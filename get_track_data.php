<!DOCTYPE html>

<html>
<head>
	<meta charset="utf-8">
	<title>Overview</title>
	<script type="text/javascript">
		window.onload = function() {
			window.setTimeout(function() {
				window.location.href = window.location.href.split('?')[0] + '?d=' + (new Date()) * 1;
			}, 1000);
		}
	</script>
</head>
<body>
	<?php $content = file_get_contents("tracking.txt"); ?>
	<?php echo nl2br($content); ?>
</body>
</html>