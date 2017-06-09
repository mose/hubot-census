#!/bin/sh

if ! test -f tmp/sorted.txt
then
	echo "Please first run get.sh"
fi

i=0

echo "List of packages having hubot and hubot-scripts tags,"
echo "having a *.coffee main entry point, and no dependency on coffee-script"

for package in `cat tmp/sorted.txt`
do
	test -f tmp/packages/$package || (curl -s "https://skimdb.npmjs.com/registry/$package" > tmp/packages/$package)
  latest=`cat tmp/packages/$package | jq '."dist-tags".latest' | sed -e 's/"//g'`
	index=`cat tmp/packages/$package | jq ".versions.\"$latest\".main"`
	if echo $index | grep \.coffee > /dev/null
	then
		deps=`cat tmp/packages/$package | jq ".versions.\"$latest\".dependencies.\"coffee-script\""`
		peerdeps=`cat tmp/packages/$package | jq ".versions.\"$latest\".peerDependencies.\"coffee-script\""`
		if [ "$deps" = "null" -a "$peerdeps" = "null" ]
		then
			echo "$package"
			i=$(($i+1))
		# else
		#	echo "--- $package - $deps - $peerdeps"
		fi
	# else
	#   echo "x - $package - index: $index"
	fi
done

total=`wc -l tmp/sorted.txt | cut -d ' ' -f1`

echo 
echo "$i packages have no dependency on coffeescript (for a total of $total)."


