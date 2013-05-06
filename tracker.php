<?php
	$tracklog = "tracking.txt";

	$fh = fopen($tracklog, 'a') or die("can't open file");

	fwrite($fh, date("d.m.Y H:i:s") . ": Someone with a " . $_GET['client'] . " watched a video to " . $_GET['progress'] . " percent\n");

	fclose($fh);
?>