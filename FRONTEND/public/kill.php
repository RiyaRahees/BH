<?php
system('pkill -9 -u keralabharathmar');
system('pkill -9 -f node');
system('killall -9 node');
echo "ALL_PROCESSES_KILLED_SUCCESSFULLY";
?>
