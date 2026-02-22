// Bangladesh Complete Location Hierarchy Data
// বাংলাদেশের সম্পূর্ণ লোকেশন হায়ারারকি ডাটা

export interface LocationData {
  divisions: {
    [division: string]: {
      districts: {
        [district: string]: {
          upazilas: {
            [upazila: string]: {
              unions: string[];
            };
          };
        };
      };
    };
  };
}

export const bangladeshLocations: LocationData = {
  divisions: {
    'Dhaka': {
      districts: {
        'Dhaka': {
          upazilas: {
            'Dhanmondi': {
              unions: ['Dhanmondi Residential Area', 'Shukrabad', 'Kalabagan', 'Jhigatola']
            },
            'Gulshan': {
              unions: ['Gulshan 1', 'Gulshan 2', 'Banani', 'Baridhara', 'Niketon']
            },
            'Mirpur': {
              unions: ['Mirpur 1', 'Mirpur 2', 'Mirpur 6', 'Mirpur 10', 'Mirpur 11', 'Mirpur 12', 'Pallabi']
            },
            'Mohammadpur': {
              unions: ['Mohammadpur Housing', 'Tajmahal Road', 'Shyamoli', 'Adabor']
            },
            'Uttara': {
              unions: ['Uttara Sector 1', 'Uttara Sector 3', 'Uttara Sector 4', 'Uttara Sector 7', 'Uttara Sector 10']
            },
            'Motijheel': {
              unions: ['Arambagh', 'Motijheel', 'Dilkusha', 'Paltan']
            },
            'Tejgaon': {
              unions: ['Tejgaon Industrial Area', 'Karwan Bazar', 'Farmgate', 'Bijoy Nagar']
            },
            'Demra': {
              unions: ['Demra', 'Matuail', 'Sarulia', 'Kodomtoli']
            },
            'Savar': {
              unions: ['Savar Pourashava', 'Amin Bazar', 'Ashulia', 'Birulia', 'Dhamsona']
            },
            'Keraniganj': {
              unions: ['Keraniganj Pourashava', 'Zinzira', 'Kalindi', 'Ruhitpur']
            },
            'Nawabganj': {
              unions: ['Nawabganj Pourashava', 'Basta', 'Shimulia', 'Barrah']
            },
            'Dohar': {
              unions: ['Dohar', 'Nagar', 'Bilaspur', 'Kusumhati']
            }
          }
        },
        'Gazipur': {
          upazilas: {
            'Gazipur Sadar': {
              unions: ['Gazipur Pourashava', 'Chandna', 'Bhawal', 'Rajendrapur', 'Barmi', 'Gazipur']
            },
            'Kaliakair': {
              unions: ['Kaliakair', 'Uluhara', 'Pubail', 'Chandra', 'Boali', 'Fulbaria']
            },
            'Kapasia': {
              unions: ['Kapasia', 'Chandpur', 'Targoan', 'Durgapur', 'Karihata', 'Singhashree']
            },
            'Sreepur': {
              unions: ['Sreepur', 'Rajabari', 'Baria', 'Gosinga', 'Barmi', 'Mouchak']
            },
            'Kaliganj': {
              unions: ['Kaliganj', 'Moktarpur', 'Tumulia', 'Nagari', 'Pubail', 'Tumilia']
            }
          }
        },
        'Narayanganj': {
          upazilas: {
            'Narayanganj Sadar': {
              unions: ['Narayanganj City', 'Siddhirganj', 'Fatullah', 'Bandar', 'Enayetnagar', 'Alirtek']
            },
            'Rupganj': {
              unions: ['Rupganj', 'Bhulta', 'Murapara', 'Kayetpara', 'Golakandail', 'Bholobo']
            },
            'Sonargaon': {
              unions: ['Sonargaon', 'Mograpara', 'Pirojpur', 'Golakandail', 'Baidder Bazar', 'Jampur']
            },
            'Bandar': {
              unions: ['Bandar Pourashava', 'West Jalkur', 'East Jalkur', 'Kalagachhiya']
            },
            'Araihazar': {
              unions: ['Araihazar', 'Satpara', 'Kashipur', 'Brahmanpara']
            }
          }
        },
        'Tangail': {
          upazilas: {
            'Tangail Sadar': {
              unions: ['Tangail Pourashava', 'Santosh', 'Kagmari', 'Adelpur', 'Porabari', 'Gharinda']
            },
            'Mirzapur': {
              unions: ['Mirzapur', 'Gorai', 'Jamurki', 'Mohera', 'Warabad', 'Anehola']
            },
            'Madhupur': {
              unions: ['Madhupur', 'Dhobari', 'Arani', 'Aushnara', 'Gojaria', 'Aronkhola']
            },
            'Gopalpur': {
              unions: ['Gopalpur', 'Hemnagar', 'Jhaoail', 'Paikara', 'Jalalpur', 'Kanchanpur']
            },
            'Basail': {
              unions: ['Basail', 'Habla', 'Kanchanpur', 'Fulki', 'Kashil']
            },
            'Bhuapur': {
              unions: ['Bhuapur', 'Lahirihat', 'Nagarpur', 'Falda', 'Gabsara']
            },
            'Delduar': {
              unions: ['Delduar', 'Fazilhati', 'Elasin', 'Deopara', 'Patharail']
            },
            'Ghatail': {
              unions: ['Ghatail', 'Lohani', 'Dhalapara', 'Lokerpara', 'Jamurki']
            },
            'Kalihati': {
              unions: ['Kalihati', 'Nagbari', 'Elenga', 'Kok Dahara', 'Kokdahara']
            },
            'Nagarpur': {
              unions: ['Nagarpur', 'Salimabad', 'Khanganj', 'Balla', 'Harduli']
            },
            'Sakhipur': {
              unions: ['Sakhipur', 'Parkha', 'Kachua', 'Borotia', 'Kakua']
            },
            'Dhanbari': {
              unions: ['Dhanbari', 'Salla', 'Hemra', 'Pogaldigha', 'Erabari']
            }
          }
        },
        'Manikganj': {
          upazilas: {
            'Manikganj Sadar': {
              unions: ['Manikganj Pourashava', 'Baliati', 'Paila', 'Tewta', 'Garpara', 'Ramkrishnapur']
            },
            'Singair': {
              unions: ['Singair', 'Baldhara', 'Jamsha', 'Talibpur', 'Charigram', 'Sayesta']
            },
            'Harirampur': {
              unions: ['Harirampur', 'Boyra', 'Dhulsura', 'Harkandi', 'Klia', 'Sutalari']
            },
            'Saturia': {
              unions: ['Saturia', 'Dhankora', 'Fukurhati', 'Varara', 'Dhalla']
            },
            'Shibalaya': {
              unions: ['Shibalaya', 'Ulail', 'Azimnagar', 'Shimulia', 'Teota']
            },
            'Daulatpur': {
              unions: ['Daulatpur', 'Bachamara', 'Klia', 'Khalsi', 'Doulatpur']
            },
            'Ghior': {
              unions: ['Ghior', 'Bartia', 'Baniajuri', 'Nali', 'Paila']
            }
          }
        },
        'Narsingdi': {
          upazilas: {
            'Narsingdi Sadar': {
              unions: ['Narsingdi Pourashava', 'Alokbali', 'Hajipur', 'Meherpara', 'Charuzilab', 'Chandanbari']
            },
            'Shibpur': {
              unions: ['Shibpur', 'Ayubpur', 'Joynagar', 'Chandanbari', 'Putia', 'Sallabad']
            },
            'Raipura': {
              unions: ['Raipura', 'Marjal', 'Musapur', 'Gazaria', 'Mahishasura', 'Panchdona']
            },
            'Belabo': {
              unions: ['Belabo', 'Binnabayd', 'Char Uzilahar', 'Narayanpur', 'Sallabad']
            },
            'Palash': {
              unions: ['Palash', 'Char Sindhur', 'Ghorashal', 'Danga', 'Jinardi']
            },
            'Monohardi': {
              unions: ['Monohardi', 'Amdia', 'Chanderkandi', 'Khidirpur', 'Sreenagar']
            }
          }
        },
        'Munshiganj': {
          upazilas: {
            'Munshiganj Sadar': {
              unions: ['Munshiganj Pourashava', 'Adhara', 'Bajrajogini', 'Baluchar', 'Char Kewar']
            },
            'Sreenagar': {
              unions: ['Sreenagar', 'Hashara', 'Kolapara', 'Shamshernagar', 'Patabhog']
            },
            'Sirajdikhan': {
              unions: ['Sirajdikhan', 'Ichapur', 'Keyain', 'Malkhanagar', 'Rasunia']
            },
            'Lohajang': {
              unions: ['Lohajang', 'Bejgaon', 'Haldia', 'Kumarbhog', 'Medini Mandal']
            },
            'Gazaria': {
              unions: ['Gazaria', 'Bausia', 'Guagachiya', 'Hosendee', 'Imampur']
            },
            'Tongibari': {
              unions: ['Tongibari', 'Autshahi', 'Betka', 'Dhipur', 'Hasail']
            }
          }
        },
        'Kishoreganj': {
          upazilas: {
            'Kishoreganj Sadar': {
              unions: ['Kishoreganj Pourashava', 'Maizhati', 'Maijkhargang', 'Pumdi', 'Sahedal']
            },
            'Bajitpur': {
              unions: ['Bajitpur', 'Dilalpur', 'Mahamudpur', 'Gazipur', 'Pirijpur']
            },
            'Bhairab': {
              unions: ['Bhairab', 'Aganagar', 'Shimulkandi', 'Paratali', 'Sahabajpur']
            },
            'Hossainpur': {
              unions: ['Hossainpur', 'Binnati', 'Hilochia', 'Jangalia', 'Pakundia']
            },
            'Itna': {
              unions: ['Itna', 'Dhonpur', 'Raytuti', 'Marjada', 'Jamalganj']
            },
            'Karimganj': {
              unions: ['Karimganj', 'Kadirjangal', 'Saidabad', 'Karjo', 'Gopdighi']
            },
            'Katiadi': {
              unions: ['Katiadi', 'Chandipasha', 'Gujadia', 'Karshakarial', 'Moshua']
            },
            'Kuliarchar': {
              unions: ['Kuliarchar', 'Astamir Char', 'Gohaliabari', 'Korsha Karia', 'Ramdia']
            },
            'Mithamain': {
              unions: ['Mithamain', 'Atpara', 'Dhaki', 'Ghagra', 'Keoarjore']
            },
            'Nikli': {
              unions: ['Nikli', 'Dampara', 'Karpasa', 'Singpur', 'Chatirchar']
            },
            'Pakundia': {
              unions: ['Pakundia', 'Jalalpur', 'Chandpur', 'Egarasindur', 'Sukhia']
            },
            'Tarail': {
              unions: ['Tarail', 'Jinari', 'Dhola', 'Narandi', 'Rauti']
            },
            'Austagram': {
              unions: ['Austagram', 'Adampur', 'Bangalpara', 'Dewghar', 'Khaliajuri']
            }
          }
        },
        'Rajbari': {
          upazilas: {
            'Rajbari Sadar': {
              unions: ['Rajbari Pourashava', 'Khankhanapur', 'Mulghar', 'Shahid Wahabpur', 'Baliakandi']
            },
            'Baliakandi': {
              unions: ['Baliakandi', 'Jamsar', 'Nawabpur', 'Shawrail', 'Bhabanipur']
            },
            'Goalanda': {
              unions: ['Goalanda', 'Ratandia', 'Ujan Char', 'Char Bishnupur']
            },
            'Pangsha': {
              unions: ['Pangsha', 'Baliahati', 'Haridhashun', 'Vabrashur', 'Ramkantapur']
            },
            'Kalukhali': {
              unions: ['Kalukhali', 'Majharbari', 'Mrigi', 'Ratanpur', 'Satura']
            }
          }
        },
        'Faridpur': {
          upazilas: {
            'Faridpur Sadar': {
              unions: ['Faridpur Pourashava', 'Aliabad', 'Ambikapur', 'Char Bishnupur', 'Kaijuri']
            },
            'Alfadanga': {
              unions: ['Alfadanga', 'Bana', 'Gopalpur', 'Tagarbanda', 'Panchuria']
            },
            'Bhanga': {
              unions: ['Bhanga', 'Hamirdia', 'Kachia', 'Nurullagonj', 'Tujerpur']
            },
            'Boalmari': {
              unions: ['Boalmari', 'Chatul', 'Dadpur', 'Ghoshpur', 'Gunbaha']
            },
            'Char Bhadrasan': {
              unions: ['Char Bhadrasan', 'Char Harirampur', 'Char Jhaukanda', 'Char Nasirpur']
            },
            'Madhukhali': {
              unions: ['Madhukhali', 'Dumain', 'Gazirtek', 'Jahapur', 'Megchami']
            },
            'Nagarkanda': {
              unions: ['Nagarkanda', 'Char Bishnupur', 'Char Maniar', 'Kashikanda', 'Talma']
            },
            'Sadarpur': {
              unions: ['Sadarpur', 'Char Janazat', 'Char Madhabdia', 'Gharua Aman', 'Krishnanagar']
            },
            'Saltha': {
              unions: ['Saltha', 'Char Bishnopur', 'Gharua', 'Ramkantapur', 'Sonapur']
            }
          }
        },
        'Gopalganj': {
          upazilas: {
            'Gopalganj Sadar': {
              unions: ['Gopalganj Pourashava', 'Chandradighalia', 'Gobra', 'Haridaspur', 'Raghdi']
            },
            'Kashiani': {
              unions: ['Kashiani', 'Bethuri', 'Fukura', 'Maheshpur', 'Nijamkandi']
            },
            'Kotalipara': {
              unions: ['Kotalipara', 'Kati', 'Kushla', 'Ramshil', 'Sadullapur']
            },
            'Muksudpur': {
              unions: ['Muksudpur', 'Bahugram', 'Jalirpar', 'Kashalia', 'Ujani']
            },
            'Tungipara': {
              unions: ['Tungipara', 'Bara Dokhshin', 'Kushli', 'Patgati', 'Ramdia']
            }
          }
        },
        'Shariatpur': {
          upazilas: {
            'Shariatpur Sadar': {
              unions: ['Shariatpur Pourashava', 'Angaria', 'Chikandi', 'Kedarpur', 'Palong']
            },
            'Bhedarganj': {
              unions: ['Bhedarganj', 'Char Atra', 'Char Banglakot', 'Kachia', 'Meher Kanda']
            },
            'Damudya': {
              unions: ['Damudya', 'Char Atair Char', 'Dankati', 'Sidya', 'Dhaka Dakshin']
            },
            'Gosairhat': {
              unions: ['Gosairhat', 'Char Kura', 'Hira Nagar', 'Idsho', 'Madhybazar']
            },
            'Naria': {
              unions: ['Naria', 'Char Atair', 'Gharisar', 'Keoya', 'Nazarpur']
            },
            'Zajira': {
              unions: ['Zajira', 'Bara Char', 'Jaynagor', 'Mulna', 'Palerchar']
            }
          }
        },
        'Madaripur': {
          upazilas: {
            'Madaripur Sadar': {
              unions: ['Madaripur Pourashava', 'Bahadurpur', 'Dhurail', 'Chilar Char', 'Kazibakai']
            },
            'Kalkini': {
              unions: ['Kalkini', 'Char Dargah', 'Kamar Khali', 'Nabagram', 'Sahebrampur']
            },
            'Rajoir': {
              unions: ['Rajoir', 'Badarpasa', 'Hosenpur', 'Kabirajpur', 'Khalsi']
            },
            'Shibchar': {
              unions: ['Shibchar', 'Bandar', 'Char Atra', 'Ditiyakhando', 'Kathalbari']
            }
          }
        }
      }
    },
    'Chittagong': {
      districts: {
        'Chittagong': {
          upazilas: {
            'Panchlaish': {
              unions: ['Nasirabad', 'Khulshi', 'Panchlaish', 'CDA Residential']
            },
            'Kotwali': {
              unions: ['Sadarghat', 'Patharghata', 'Asadganj', 'Bakalia']
            },
            'Patenga': {
              unions: ['Patenga', 'Karnaphuli', 'Halishahar', 'Bandartila']
            },
            'Bayazid': {
              unions: ['Bayazid Bostami', 'Nasirabad', 'Sholoshahar', 'Jamal Khan']
            },
            'Halishahar': {
              unions: ['Halishahar Housing', 'Port Connecting Road', 'CDA Avenue']
            },
            'Anwara': {
              unions: ['Anwara', 'Battali', 'Burumachara', 'Juidandi', 'Haildhar', 'Paraikora']
            },
            'Raozan': {
              unions: ['Raozan', 'Bagoan', 'Gahira', 'Noapara', 'Dabua', 'Urkirchar']
            },
            'Rangunia': {
              unions: ['Rangunia', 'Betagi', 'Chandraghona', 'Islamabad', 'Lalanagar', 'Mariamnagar']
            },
            'Sandwip': {
              unions: ['Sandwip', 'Amanullah', 'Bauria', 'Dirghapar', 'Gachua', 'Haramia']
            },
            'Satkania': {
              unions: ['Satkania', 'Baitul Ijjat', 'Bazalia', 'Dhemsa', 'Khagaria', 'Paindong']
            },
            'Sitakunda': {
              unions: ['Sitakunda', 'Barabkunda', 'Baroidhala', 'Fatikchari', 'Kumira', 'Sonakania']
            },
            'Banshkhali': {
              unions: ['Banshkhali', 'Baharchhara', 'Chambal', 'Gondamara', 'Khankhanabad', 'Puichhari']
            },
            'Boalkhali': {
              unions: ['Boalkhali', 'Charandwip', 'Iqbal Park', 'Kanungopara', 'Sarulia']
            },
            'Chandanaish': {
              unions: ['Chandanaish', 'Bara Uthan', 'Barama', 'Dohazari', 'Haitkandi', 'Purba Jafarnagar']
            },
            'Fatikchhari': {
              unions: ['Fatikchhari', 'Bhandar Sharif', 'Dharmapur', 'Lelang', 'Najirhat', 'Sundarpur']
            },
            'Hathazari': {
              unions: ['Hathazari', 'Chunati', 'Farhadabad', 'Gorduara', 'Katirhat', 'Madrasa']
            },
            'Lohagara': {
              unions: ['Lohagara', 'Adhar Manik', 'Amirabad', 'Chunati', 'Padua', 'Putibila']
            },
            'Mirsharai': {
              unions: ['Mirsharai', 'Abutorab', 'Durgapur', 'Hinguli', 'Jorarganj', 'Wahedpur']
            },
            'Patiya': {
              unions: ['Patiya', 'Budhpara', 'Chhanua', 'Haidgaon', 'Kachuai', 'Sobhandandi']
            }
          }
        },
        'Cox\'s Bazar': {
          upazilas: {
            'Cox\'s Bazar Sadar': {
              unions: ['Cox\'s Bazar Pourashava', 'Islamabad', 'Jhilongja', 'Khurushkul', 'Bakkhali', 'Chowfaldandi']
            },
            'Teknaf': {
              unions: ['Teknaf', 'Whykong', 'St. Martin Island', 'Sabrang', 'Baharchara', 'Hnila']
            },
            'Ukhia': {
              unions: ['Ukhia', 'Ratnapalong', 'Palong Khali', 'Raja Palong', 'Haldia Palong', 'Jalia Palong']
            },
            'Ramu': {
              unions: ['Ramu', 'Rajarkul', 'Kawarkhop', 'Eidgaon', 'Chakmarkul', 'Dakkin Mithachhari']
            },
            'Chakaria': {
              unions: ['Chakaria', 'Baraitali', 'Kakara', 'Khutakhali', 'Fashiakhali', 'Harbang']
            },
            'Maheshkhali': {
              unions: ['Maheshkhali', 'Bara Maheshkhali', 'Chhotamaheshkhali', 'Hoanak', 'Kutubdia']
            },
            'Kutubdia': {
              unions: ['Kutubdia', 'Ali Akbar Deil', 'Khuruskul', 'Lemsikhali', 'Uttar Dhurung']
            },
            'Pekua': {
              unions: ['Pekua', 'Barabakia', 'Magnama', 'Rajakhali', 'Shilkhali', 'Taytong']
            }
          }
        },
        'Comilla': {
          upazilas: {
            'Comilla Sadar': {
              unions: ['Comilla Cantonment', 'Kandirpar', 'Ranir Bazar', 'Tomsom Bridge', 'Bagmara', 'Bijoypur']
            },
            'Daudkandi': {
              unions: ['Daudkandi', 'Eliotganj', 'Gouripur', 'Matiganj', 'Batisa', 'Padua']
            },
            'Chandina': {
              unions: ['Chandina', 'Madhabpur', 'Purba Pahartali', 'Sadipur', 'Bagmara', 'Madhaiabari']
            },
            'Muradnagar': {
              unions: ['Muradnagar', 'Gunjaria', 'Tanki', 'Bangra', 'Darora', 'Jagannatdighi']
            },
            'Barura': {
              unions: ['Barura', 'Adra', 'Galimpur', 'Madhaiya', 'Panjara', 'Shahpur']
            },
            'Brahmanpara': {
              unions: ['Brahmanpara', 'Kaitala', 'Madhabpur', 'Shasidal', 'Sultanpur']
            },
            'Burichang': {
              unions: ['Burichang', 'Bakshimul', 'Mainamati', 'Mokam', 'Pirjatrapur', 'Rajapur']
            },
            'Debidwar': {
              unions: ['Debidwar', 'Babu Sardar', 'Barmaskar', 'Elanagar', 'Elahabad', 'Sundolpur']
            },
            'Homna': {
              unions: ['Homna', 'Asadpur', 'Bangora', 'Chitholia', 'Daulat Khan', 'Jorkamalja']
            },
            'Laksam': {
              unions: ['Laksam', 'Andikot', 'Bangadda', 'Chandla', 'Paikpara', 'Sarail']
            },
            'Meghna': {
              unions: ['Meghna', 'Amarpur', 'Bhuapur', 'Rajargaon']
            },
            'Monohorganj': {
              unions: ['Monohorganj', 'Bakhrabad', 'Char Ata', 'Faridpur', 'Pathannagar', 'Uthura']
            },
            'Nangalkot': {
              unions: ['Nangalkot', 'Bangodda', 'Chhitasha', 'Durgapur', 'Madhaia Bari', 'Peria']
            },
            'Titas': {
              unions: ['Titas', 'Chandra', 'Chaughati', 'Debiddar', 'Muhuri', 'Serail']
            }
          }
        },
        'Feni': {
          upazilas: {
            'Feni Sadar': {
              unions: ['Feni Pourashava', 'Fazilpur', 'Lemua', 'Subhapur', 'Dhananjaypur', 'Dholia']
            },
            'Daganbhuiyan': {
              unions: ['Daganbhuiyan', 'Matubhuiyan', 'Rajapur', 'Jayloskor', 'Matiganj', 'Shubhapur']
            },
            'Chhagalnaiya': {
              unions: ['Chhagalnaiya', 'Radhanagar', 'Subol', 'Maharajpur', 'Choumohani', 'Mohamaya']
            },
            'Fulgazi': {
              unions: ['Fulgazi', 'Amzadhat', 'Dorbarpur', 'Fazilpur', 'Munshirhat', 'Satani']
            },
            'Parshuram': {
              unions: ['Parshuram', 'Chitholia', 'Hazipur', 'Kazirbag', 'Mirzanagar', 'Parshuram']
            },
            'Sonagazi': {
              unions: ['Sonagazi', 'Ahmadpur', 'Char Chandra', 'Nababpur', 'Sonagazi Pourashava']
            }
          }
        },
        'Brahmanbaria': {
          upazilas: {
            'Brahmanbaria Sadar': {
              unions: ['Brahmanbaria Pourashava', 'Amtail', 'Bakshiganj', 'Dharmapur', 'Khalishahar']
            },
            'Akhaura': {
              unions: ['Akhaura', 'Azampur', 'Gangasagar', 'Mogra', 'Purbachak', 'Sultanpur']
            },
            'Ashuganj': {
              unions: ['Ashuganj', 'Bayek', 'Chandura', 'Mariamnagar', 'Syedpur']
            },
            'Bancharampur': {
              unions: ['Bancharampur', 'Bakshimail', 'Betbariya', 'Char Paika', 'Majlishpur', 'Sholaghar']
            },
            'Bijoynagar': {
              unions: ['Bijoynagar', 'Chandura', 'Ghatiura', 'Noapara', 'Rajghat', 'Salimganj']
            },
            'Kasba': {
              unions: ['Kasba', 'Gopinathpur', 'Khaliharpur', 'Kuti', 'Ramrail', 'Shalimar']
            },
            'Nabinagar': {
              unions: ['Nabinagar', 'Arshanganj', 'Binnabaid', 'Jibonpur', 'Kaitala', 'Salimganj']
            },
            'Nasirnagar': {
              unions: ['Nasirnagar', 'Dakshin Chor', 'Hasailbanigram', 'Kutiara', 'Sonarampur']
            },
            'Sarail': {
              unions: ['Sarail', 'Ayas', 'Chhuramankha', 'Kaithula', 'Noagaon', 'Shahabazpur']
            }
          }
        },
        'Rangamati': {
          upazilas: {
            'Rangamati Sadar': {
              unions: ['Rangamati Pourashava', 'Mogban', 'Kutukchari', 'Rajosthali', 'Sapchori']
            },
            'Kaptai': {
              unions: ['Kaptai', 'Chandraghona', 'Chitmorom', 'Raikhali', 'Waggachori']
            },
            'Baghaichhari': {
              unions: ['Baghaichhari', 'Amtoli', 'Marisha', 'Rupnagar', 'Sajek']
            },
            'Barkal': {
              unions: ['Barkal', 'Aimachori', 'Baishari', 'Farua', 'Khagrachari']
            },
            'Belaichhari': {
              unions: ['Belaichhari', 'Amtola', 'Rupsihanir', 'Aimi Karbar']
            },
            'Juraichhari': {
              unions: ['Juraichhari', 'Bangalh alia', 'Dumdumya', 'Maidang']
            },
            'Kaukhali': {
              unions: ['Kaukhali', 'Betbania', 'Dullyatali', 'Vasangiri']
            },
            'Langadu': {
              unions: ['Langadu', 'Atorkchhari', 'Boalkhali', 'Nimachari', 'Rajbila']
            },
            'Nannerchar': {
              unions: ['Nannerchar', 'Burighat', 'Ghilachari', 'Sabujjopara', 'Tarash']
            },
            'Rajasthali': {
              unions: ['Rajasthali', 'Bangalhalia', 'Ghagra', 'Guimara', 'Kucchaktali']
            }
          }
        },
        'Khagrachhari': {
          upazilas: {
            'Khagrachhari Sadar': {
              unions: ['Khagrachhari Pourashava', 'Harchori', 'Kamalchari', 'Logang', 'Merung']
            },
            'Dighinala': {
              unions: ['Dighinala', 'Babuchara', 'Baghaihat', 'Boalkhali', 'Merung']
            },
            'Lakshmichhari': {
              unions: ['Lakshmichhari', 'Barmachari', 'Dullyatali', 'Lota Mura']
            },
            'Mahalchhari': {
              unions: ['Mahalchhari', 'Khedarmara', 'Maischari', 'Mobachari']
            },
            'Manikchhari': {
              unions: ['Manikchhari', 'Batnatali', 'Jogyachola', 'Tintahari']
            },
            'Matiranga': {
              unions: ['Matiranga', 'Amtali', 'Betchari', 'Gomati', 'Guimara']
            },
            'Panchhari': {
              unions: ['Panchhari', 'Latabandha', 'Latiban', 'Logang', 'Sinduka']
            },
            'Ramgarh': {
              unions: ['Ramgarh', 'Bangalhalia', 'Fatikchari', 'Hafchari', 'Paitachari']
            }
          }
        },
        'Bandarban': {
          upazilas: {
            'Bandarban Sadar': {
              unions: ['Bandarban Pourashava', 'Kuhalong', 'Rajbila', 'Sualok', 'Tankabati']
            },
            'Alikadam': {
              unions: ['Alikadam', 'Choykhang', 'Kyawdangpara']
            },
            'Lama': {
              unions: ['Lama', 'Aziznagar', 'Fashiakhali', 'Faitkchhari', 'Gajalia', 'Rupushipara']
            },
            'Naikhongchhari': {
              unions: ['Naikhongchhari', 'Baisari', 'Dochari', 'Ghumdum', 'Naitong']
            },
            'Rowangchhari': {
              unions: ['Rowangchhari', 'Alekyong', 'Noapatang', 'Taracha']
            },
            'Ruma': {
              unions: ['Ruma', 'Galengya', 'Paikthali', 'Remakri']
            },
            'Thanchi': {
              unions: ['Thanchi', 'Balipara', 'Bolipara', 'Remakripara', 'Tindu']
            }
          }
        },
        'Noakhali': {
          upazilas: {
            'Noakhali Sadar': {
              unions: ['Noakhali Pourashava', 'Char Jubilee', 'Char Parboti', 'Dhansiri', 'Niazpur', 'Panchgaon']
            },
            'Begumganj': {
              unions: ['Begumganj', 'Amanulla', 'Chhatarpaia', 'Durgapur', 'Jahanpur', 'Keora']
            },
            'Chatkhil': {
              unions: ['Chatkhil', 'Dakshin Charmatua', 'Khilpara', 'Laxmanpur', 'Patrakha']
            },
            'Companiganj': {
              unions: ['Companiganj', 'Basurhaat', 'Char Elahi', 'Char Fakira', 'Sirajpur']
            },
            'Hatiya': {
              unions: ['Hatiya', 'Burirchar', 'Char Ishwar', 'Chandipur', 'Jahajmara', 'Nilkamal']
            },
            'Kabirhat': {
              unions: ['Kabirhat', 'Bata Kandi', 'Charjabbar', 'Noakhala', 'Sreerampur']
            },
            'Senbagh': {
              unions: ['Senbagh', 'Char Matua', 'Dumuria', 'Joykrishnapur', 'Mohammadpur']
            },
            'Sonaimuri': {
              unions: ['Sonaimuri', 'Ambarnagar', 'Bazra', 'Nateshwar', 'Sonapur']
            },
            'Subarnachar': {
              unions: ['Subarnachar', 'Char Bata', 'Char Jabbar', 'Char Jubilee', 'Char Wapda']
            }
          }
        },
        'Lakshmipur': {
          upazilas: {
            'Lakshmipur Sadar': {
              unions: ['Lakshmipur Pourashava', 'Bangakha', 'Char Ramiz', 'Dalal Bazar', 'Shakchar']
            },
            'Kamalnagar': {
              unions: ['Kamalnagar', 'Chandipur', 'Char Lawrence', 'Char Martin', 'Patarirhat']
            },
            'Raipur': {
              unions: ['Raipur', 'Bhatra', 'Char Kadira', 'Hamidpur', 'Ichhapur', 'Keroa']
            },
            'Ramganj': {
              unions: ['Ramganj', 'Char Abdulla', 'Char Falkon', 'Char Ramiz Bagan', 'Lamchar']
            },
            'Ramgati': {
              unions: ['Ramgati', 'Char Gachua', 'Char Poragacha', 'Kalibari', 'Vahula']
            }
          }
        },
        'Chandpur': {
          upazilas: {
            'Chandpur Sadar': {
              unions: ['Chandpur Pourashava', 'Baghadi', 'Chitrakotkot', 'Jamirta', 'Paikpara']
            },
            'Faridganj': {
              unions: ['Faridganj', 'Chardukhia', 'Gobindapur', 'Madhya Ghar', 'Rupsha']
            },
            'Haimchar': {
              unions: ['Haimchar', 'Char Bhairavi', 'Gajaria', 'Hayemchar Uttar', 'Joykalaba']
            },
            'Hajiganj': {
              unions: ['Hajiganj', 'Char Kalmi', 'Gandharbapur', 'Kanchanpur', 'Sakhua']
            },
            'Kachua': {
              unions: ['Kachua', 'Ashrafpur', 'Char Dukhia', 'Kadam Rasul', 'Kachur Char']
            },
            'Matlab Dakshin': {
              unions: ['Matlab Dakshin', 'Fulgazi', 'Ghatimara', 'Hajimara', 'Kashinagar']
            },
            'Matlab Uttar': {
              unions: ['Matlab Uttar', 'Bisway', 'Gopaldi', 'Kashinagar', 'Musapur']
            },
            'Shahrasti': {
              unions: ['Shahrasti', 'Char Atra', 'Gandhamati', 'Kalcho', 'Paik Para']
            }
          }
        }
      }
    },
    'Rajshahi': {
      districts: {
        'Rajshahi': {
          upazilas: {
            'Rajshahi Sadar': {
              unions: ['Shaheb Bazar', 'Hetem Khan', 'Rajpara', 'Motihar']
            },
            'Poba': {
              unions: ['Poba', 'Harian', 'Belpukuria', 'Chanduria']
            },
            'Mohanpur': {
              unions: ['Mohanpur', 'Baksimoil', 'Ganguria', 'Jahanabad']
            },
            'Godagari': {
              unions: ['Godagari', 'Asariadaha', 'Basudebpur', 'Pakri']
            },
            'Durgapur': {
              unions: ['Durgapur', 'Joipur', 'Deopara', 'Maria']
            }
          }
        },
        'Bogra': {
          upazilas: {
            'Bogra Sadar': {
              unions: ['Bogra Pourashava', 'Shibganj', 'Shajahanpur', 'Khandahar', 'Gokul', 'Lalpur', 'Namuja', 'Chandan Baisha']
            },
            'Shibganj': {
              unions: ['Shibganj', 'Buriganj', 'Mokamtala', 'Shahabaj', 'Chopinagar', 'Gohail']
            },
            'Sherpur': {
              unions: ['Sherpur', 'Bhabanipur', 'Garidah', 'Khottapara', 'Chaluabari', 'Gobindoganj', 'Khanpur']
            },
            'Adamdighi': {
              unions: ['Adamdighi', 'Chapapur', 'Nasratpur', 'Santahar', 'Chauhali', 'Kundagram']
            },
            'Kahaloo': {
              unions: ['Kahaloo', 'Jamgaon', 'Kutubpur', 'Majhihatta', 'Pagolhat', 'Mohastan']
            },
            'Nandigram': {
              unions: ['Nandigram', 'Bishalpur', 'Chhaygaon', 'Mohasthangarh', 'Pakulla']
            },
            'Dhunat': {
              unions: ['Dhunat', 'Alokjhari', 'Gobindoganj', 'Kalerpara', 'Shibpur']
            },
            'Dhupchanchia': {
              unions: ['Dhupchanchia', 'Gobrait', 'Zianagar', 'Talora', 'Nimgachhi']
            },
            'Gabtali': {
              unions: ['Gabtali', 'Balua', 'Gidhara', 'Radhanagor', 'Sonatala', 'Kakina']
            },
            'Shajahanpur': {
              unions: ['Shajahanpur', 'Chandanbaisha', 'Chhaygaon', 'Karnibari', 'Chopinagar']
            },
            'Sonatola': {
              unions: ['Sonatola', 'Ballavpur', 'Chandan Baisha', 'Pakulla', 'Tekani']
            },
            'Sariakandi': {
              unions: ['Sariakandi', 'Bohail', 'Chaluabari', 'Hatsherpur', 'Kamalpur', 'Khamarait']
            }
          }
        },
        'Pabna': {
          upazilas: {
            'Pabna Sadar': {
              unions: ['Pabna Pourashava', 'Hemayetpur', 'Raninagar', 'Maligachha', 'Bharara', 'Chatmohar']
            },
            'Ishwardi': {
              unions: ['Ishwardi', 'Pakshi', 'Muladuli', 'Chuadanga', 'Chakmirpur', 'Salimpur']
            },
            'Santhia': {
              unions: ['Santhia', 'Shahzadpur', 'Nazirganj', 'Bagbati', 'Ahammadpur', 'Kalikapur']
            },
            'Atgharia': {
              unions: ['Atgharia', 'Hemayetpur', 'Raninagar', 'Bera', 'Chargram', 'Dapunia']
            },
            'Chatmohar': {
              unions: ['Chatmohar', 'Bhangura', 'Gumani', 'Haripur', 'Faridpur']
            },
            'Bera': {
              unions: ['Bera', 'Bahadurpur', 'Chakla', 'Dapunia', 'Hatkhola']
            },
            'Faridpur': {
              unions: ['Faridpur', 'Acharya', 'Boalmari', 'Charbhadrasan', 'Gazirtek']
            },
            'Bhangura': {
              unions: ['Bhangura', 'Ashtamanisha', 'Dilpashar', 'Mohanpur']
            },
            'Sujanagar': {
              unions: ['Sujanagar', 'Ahammadpur', 'Bahadurpur', 'Dulai', 'Nazirpur']
            }
          }
        },
        'Natore': {
          upazilas: {
            'Natore Sadar': {
              unions: ['Natore Pourashava', 'Madhnagar', 'Baraigram', 'Khajura', 'Chamari', 'Gopalganj']
            },
            'Baraigram': {
              unions: ['Baraigram', 'Gopalpur', 'Chandai', 'Nagor', 'Bonpara', 'Dayarampur', 'Joynagor']
            },
            'Gurudaspur': {
              unions: ['Gurudaspur', 'Moharajpur', 'Chhatraji', 'Kendua', 'Biprobelghoria', 'Khajuria']
            },
            'Bagatipara': {
              unions: ['Bagatipara', 'Dayarampur', 'Lalpur', 'Majgoan', 'Pakuria']
            },
            'Lalpur': {
              unions: ['Lalpur', 'Arjunpur', 'Bilmaria', 'Duaria', 'Ishwardi']
            },
            'Naldanga': {
              unions: ['Naldanga', 'Luxmipurkhabaspara', 'Singra', 'Sukash']
            },
            'Singra': {
              unions: ['Singra', 'Chongdhupoil', 'Kalam', 'Tajpur']
            }
          }
        },
        'Naogaon': {
          upazilas: {
            'Naogaon Sadar': {
              unions: ['Naogaon Pourashava', 'Hashaigari', 'Kalikapur', 'Matindor', 'Paharpur', 'Patnitala']
            },
            'Manda': {
              unions: ['Manda', 'Bhavanipur', 'Kosba', 'Kshipur', 'Tetulia', 'Kusumba']
            },
            'Atrai': {
              unions: ['Atrai', 'Ahsanganj', 'Bhabicha', 'Kalikapur', 'Shahabajpur']
            },
            'Raninagar': {
              unions: ['Raninagar', 'Gopalpur', 'Kashipur', 'Paranpur', 'Shiroil']
            },
            'Niamatpur': {
              unions: ['Niamatpur', 'Hajinagar', 'Kalikapur', 'Khajur', 'Rashidpur']
            },
            'Patnitala': {
              unions: ['Patnitala', 'Akbarpur', 'Dupchanchia', 'Nirmail']
            },
            'Dhamoirhat': {
              unions: ['Dhamoirhat', 'Agradigun', 'Bhaturia', 'Ismailpur', 'Kashipur']
            },
            'Mohadevpur': {
              unions: ['Mohadevpur', 'Baktiarpur', 'Chandas', 'Enayetpur', 'Uttar Gopalpur']
            },
            'Porsha': {
              unions: ['Porsha', 'Ahammedpur', 'Arazi Shirla', 'Dharampur', 'Goala']
            },
            'Sapahar': {
              unions: ['Sapahar', 'Aihai', 'Goala', 'Patari', 'Shirshakandi']
            },
            'Badalgachhi': {
              unions: ['Badalgachhi', 'Bahadurpur', 'Balua', 'Moharajpur', 'Mithapur']
            }
          }
        },
        'Chapainawabganj': {
          upazilas: {
            'Chapainawabganj Sadar': {
              unions: ['Chapainawabganj Pourashava', 'Bharoikhola', 'Debinagar', 'Jhilim', 'Sundarpur']
            },
            'Gomostapur': {
              unions: ['Gomostapur', 'Alipur', 'Boalia', 'Char Anupnagar', 'Rahanpur']
            },
            'Nachole': {
              unions: ['Nachole', 'Gomostapur', 'Kasba', 'Nishchintopur', 'Shekerpur']
            },
            'Bholahat': {
              unions: ['Bholahat', 'Daldali', 'Gobarghata', 'Jambaria', 'Shakhara']
            },
            'Shibganj': {
              unions: ['Shibganj', 'Binodnagar', 'Char Pakhia', 'Moharajpur', 'Shahjahanpur']
            }
          }
        },
        'Sirajganj': {
          upazilas: {
            'Sirajganj Sadar': {
              unions: ['Sirajganj Pourashava', 'Bahadurpur', 'Chala Nagar', 'Kamarkhand', 'Ratankandi']
            },
            'Belkuchi': {
              unions: ['Belkuchi', 'Bagbati', 'Dhulauria', 'Enayetpur', 'Saidabad']
            },
            'Chauhali': {
              unions: ['Chauhali', 'Chak Rajpur', 'Gandail', 'Nattuarpara', 'Sthal']
            },
            'Kamarkhand': {
              unions: ['Kamarkhand', 'Dhamil', 'Jalalpur', 'Kamarkhand Purba', 'Sonakhara']
            },
            'Kazipur': {
              unions: ['Kazipur', 'Chandaikona', 'Gandail', 'Khasrajampur', 'Maizhati']
            },
            'Raiganj': {
              unions: ['Raiganj', 'Bolbola', 'Dhangora', 'Hashinapur', 'Soydabad']
            },
            'Shahjadpur': {
              unions: ['Shahjadpur', 'Beltail', 'Gala', 'Kaijuri', 'Potazia']
            },
            'Tarash': {
              unions: ['Tarash', 'Deshigram', 'Jamirta', 'Madhainagar', 'Natuarpara']
            },
            'Ullahpara': {
              unions: ['Ullahpara', 'Baruhash', 'Durga Nagar', 'Hatikumrul', 'Panchkrushi']
            }
          }
        },
        'Joypurhat': {
          upazilas: {
            'Joypurhat Sadar': {
              unions: ['Joypurhat Pourashava', 'Bambu', 'Joypur', 'Maidanhatta', 'Mohammadabad']
            },
            'Akkelpur': {
              unions: ['Akkelpur', 'Khamarpara', 'Paria', 'Punirbash', 'Rukindipur']
            },
            'Kalai': {
              unions: ['Kalai', 'Adhaipur', 'Dharanjoii', 'Jinari', 'Kushumba']
            },
            'Khetlal': {
              unions: ['Khetlal', 'Bhadsha', 'Dharanjo', 'Puranapail']
            },
            'Panchbibi': {
              unions: ['Panchbibi', 'Aymarasulpur', 'Bhadsha', 'Dharmadas', 'Mariam Nagar']
            }
          }
        }
      }
    },
    'Khulna': {
      districts: {
        'Khulna': {
          upazilas: {
            'Khulna Sadar': {
              unions: ['Daulatpur', 'Khalishpur', 'Sonadanga', 'Khan Jahan Ali', 'Boyra', 'Aranghata']
            },
            'Sonadanga': {
              unions: ['Sonadanga', 'Boyra', 'Rupsha', 'Aronghata', 'Phultala']
            },
            'Daulatpur': {
              unions: ['Daulatpur', 'Labanchara', 'Ghasipur', 'Bhola', 'Chandpur']
            },
            'Khalishpur': {
              unions: ['Khalishpur', 'Jahanabad', 'Goalkhali', 'Rajapur', 'Ansar Nagar']
            },
            'Dumuria': {
              unions: ['Dumuria', 'Sobhana', 'Dhamalia', 'Kharnia', 'Magurghona']
            },
            'Paikgachha': {
              unions: ['Paikgachha', 'Chandkhali', 'Garaikhali', 'Kapilmuni']
            },
            'Dighalia': {
              unions: ['Dighalia', 'Senhati', 'Barasat', 'Gazirhat']
            },
            'Koyra': {
              unions: ['Koyra', 'Amadi', 'Bagali', 'Maharajpur', 'Uttar Bedkashi']
            },
            'Terokhada': {
              unions: ['Terokhada', 'Barakpur', 'Chitra', 'Madana', 'Sochiadah']
            }
          }
        },
        'Jessore': {
          upazilas: {
            'Jessore Sadar': {
              unions: ['Jessore Pourashava', 'Chanchra', 'Fatepur', 'Ramnagar', 'Basundia', 'Khejur']
            },
            'Sharsha': {
              unions: ['Sharsha', 'Benapole', 'Bagachra', 'Dihi', 'Kayba', 'Putkhali']
            },
            'Chaugachha': {
              unions: ['Chaugachha', 'Jagadishpur', 'Sukpukhuria', 'Dhalgram', 'Fatepur', 'Pashapole']
            },
            'Jhikargachha': {
              unions: ['Jhikargachha', 'Godkhali', 'Haridaskati', 'Shankarpur', 'Magura']
            },
            'Abhaynagar': {
              unions: ['Abhaynagar', 'Baghutia', 'Chalibanga', 'Noapara', 'Sundali']
            },
            'Bagherpara': {
              unions: ['Bagherpara', 'Fatepur', 'Jamdia', 'Manirumpa', 'Rohita']
            },
            'Keshabpur': {
              unions: ['Keshabpur', 'Bidyanandakati', 'Gaurighona', 'Mangalkot', 'Panchgarh']
            },
            'Manirampur': {
              unions: ['Manirampur', 'Charkulia', 'Durbadanga', 'Khedapara', 'Mahmudpur']
            }
          }
        },
        'Satkhira': {
          upazilas: {
            'Satkhira Sadar': {
              unions: ['Satkhira Pourashava', 'Brahmarajpur', 'Kuskhali', 'Shibpur', 'Jhaudanga']
            },
            'Kalaroa': {
              unions: ['Kalaroa', 'Helatala', 'Jogikhali', 'Kushadanga', 'Mautala', 'Ratanpur']
            },
            'Tala': {
              unions: ['Tala', 'Khalilnagar', 'Khesra', 'Nagarghata', 'Tentulia']
            },
            'Debhata': {
              unions: ['Debhata', 'Parulia', 'Sakra', 'Kulbaria', 'Noapara']
            },
            'Assasuni': {
              unions: ['Assasuni', 'Budhhata', 'Kadakati', 'Sobhnali', 'Sreeula']
            },
            'Shyamnagar': {
              unions: ['Shyamnagar', 'Atulia', 'Burigoalini', 'Gabura', 'Munshiganj']
            },
            'Kaliganj': {
              unions: ['Kaliganj', 'Bishnupur', 'Chandanpur', 'Kushadanga', 'Mathuresh']
            }
          }
        },
        'Bagerhat': {
          upazilas: {
            'Bagerhat Sadar': {
              unions: ['Bagerhat Pourashava', 'Bishnupur', 'Gota Pakhia', 'Karapara', 'Rakhalgachhi']
            },
            'Mongla': {
              unions: ['Mongla Port', 'Chila', 'Sundarbans East', 'Burirdanga', 'Sundarban']
            },
            'Morrelganj': {
              unions: ['Morrelganj', 'Nishanbaria', 'Uzalkur', 'Khaulia', 'Baraikhali']
            },
            'Fakirhat': {
              unions: ['Fakirhat', 'Bahirdia', 'Betaga', 'Mulghar', 'Piljanga']
            },
            'Mollahat': {
              unions: ['Mollahat', 'Barabaria', 'Chandpur', 'Gaola', 'Kalia']
            },
            'Sarankhola': {
              unions: ['Sarankhola', 'Khontakata', 'Rayenda', 'Southkhali']
            },
            'Rampal': {
              unions: ['Rampal', 'Baintala', 'Haridasmati', 'Joykul', 'Mongla']
            },
            'Chitalmari': {
              unions: ['Chitalmari', 'Barabaria', 'Bharaskol', 'Hizla', 'Kalatala']
            },
            'Kachua': {
              unions: ['Kachua', 'Badhal', 'Durgapur', 'Garaikhali', 'Raripara']
            }
          }
        },
        'Chuadanga': {
          upazilas: {
            'Chuadanga Sadar': {
              unions: ['Chuadanga Pourashava', 'Ailhash', 'Begumpur', 'Gangni', 'Hasadah']
            },
            'Alamdanga': {
              unions: ['Alamdanga', 'Barakpur', 'Bhabanipur', 'Dauki', 'Juranpur']
            },
            'Damurhuda': {
              unions: ['Damurhuda', 'Hawli', 'Karpashdanga', 'Kursha', 'Nataipara']
            },
            'Jibannagar': {
              unions: ['Jibannagar', 'Bagoan', 'Hardi', 'Kulaghat', 'Parulia']
            }
          }
        },
        'Kushtia': {
          upazilas: {
            'Kushtia Sadar': {
              unions: ['Kushtia Pourashava', 'Amla', 'Bahirdanga', 'Choupukuria', 'Jagonnathpur', 'Panti']
            },
            'Kumarkhali': {
              unions: ['Kumarkhali', 'Bahirchar', 'Chapra', 'Jadabpur', 'Kaya', 'Shelaidah']
            },
            'Khoksa': {
              unions: ['Khoksa', 'Ambaria', 'Bethbaria', 'Gobindapur', 'Osmanpur']
            },
            'Mirpur': {
              unions: ['Mirpur', 'Balarambati', 'Dhaneshwargati', 'Garidah', 'Joyntihazra']
            },
            'Daulatpur': {
              unions: ['Daulatpur', 'Boalia', 'Jugia', 'Kursha', 'Philipnagor']
            },
            'Bheramara': {
              unions: ['Bheramara', 'Bahirchar', 'Dariapur', 'Khadimpur', 'Monakasha']
            }
          }
        },
        'Jhenaidah': {
          upazilas: {
            'Jhenaidah Sadar': {
              unions: ['Sadhuhati', 'Madhuhati', 'Saganna', 'Halidhani', 'Kumrabaria', 'Ganna', 'Maharajpur', 'Paglakana', 'Porahati', 'Harishankarpur', 'Padmakar', 'Dogachi', 'Fursandi', 'Ghorshal', 'Kalicharanpur', 'Surat', 'Naldanga']
            },
            'Kaliganj': {
              unions: ['Trilochanpur', 'Sundarpur-Durgapur', 'Rakhalgachi', 'Niamatpur', 'Kushna', 'Maheshwarpur', 'Malatipur', 'Kola', 'Bhaireba', 'Mathurapur', 'Barobazar']
            },
            'Kotchandpur': {
              unions: ['Baluhar', 'Dora', 'Elangi', 'Kushna', 'Sabdalpur']
            },
            'Maheshpur': {
              unions: ['Banshbaria', 'Kajirber', 'Natima', 'Shyamkur', 'Swaruppur', 'Padmapukur', 'Dattinagar', 'Nepalbaria', 'Bokshipur', 'Azampur', 'Fatepur', 'Jadabpur']
            },
            'Shailkupa': {
              unions: ['Tribeni', 'Mirzapur', 'Dignagar', 'Kacherkol', 'Abhaynagar', 'Dudhsar', 'Banshbaria', 'Kancherkol', 'Manoharpur', 'Sailkupa', 'Umedpur', 'Nityanandapur', 'Hakimpur', 'Baghutia']
            },
            'Harinakunda': {
              unions: ['Harinakunda', 'Kapashatia', 'Dhoradanga', 'Daulatpur', 'Joradah', 'Raghunathpur', 'Taherhuda', 'Chandpur']
            }
          }
        },
        'Magura': {
          upazilas: {
            'Magura Sadar': {
              unions: ['Magura Pourashava', 'Arpara', 'Binaoda', 'Gopalgram', 'Kuchiamora', 'Palashbaria']
            },
            'Mohammadpur': {
              unions: ['Mohammadpur', 'Baliakandi', 'Binodpur', 'Dariapur', 'Hazra Thana']
            },
            'Shalikha': {
              unions: ['Shalikha', 'Bhabanipur', 'Bunagati', 'Digha', 'Satrijhitpur']
            },
            'Sreepur': {
              unions: ['Sreepur', 'Babukhali', 'Chhatian', 'Nahabadh', 'Raghobdair']
            }
          }
        },
        'Narail': {
          upazilas: {
            'Narail Sadar': {
              unions: ['Narail Pourashava', 'Bhadrabila', 'Itna', 'Kalukhli', 'Madhubagh', 'Tularampur']
            },
            'Lohagara': {
              unions: ['Lohagara', 'Digha', 'Itna', 'Kashipur', 'Lakshmipasha']
            },
            'Kalia': {
              unions: ['Kalia', 'Balli', 'Hamidpur', 'Joynagar', 'Maijpara']
            }
          }
        },
        'Meherpur': {
          upazilas: {
            'Meherpur Sadar': {
              unions: ['Meherpur Pourashava', 'Amjhupi', 'Bagoan', 'Buripota', 'Dariapur', 'Tentultala']
            },
            'Gangni': {
              unions: ['Gangni', 'Bara', 'Dhankola', 'Kaya', 'Sholotaka']
            },
            'Mujibnagar': {
              unions: ['Mujibnagar', 'Baguan', 'Darshana', 'Monakhali']
            }
          }
        }
      }
    },
    'Sylhet': {
      districts: {
        'Sylhet': {
          upazilas: {
            'Sylhet Sadar': {
              unions: ['Jalalabad', 'Ambarkhana', 'Zindabazar', 'Uposhohor', 'Mogla Bazar', 'Tukerbazar']
            },
            'Jalalabad': {
              unions: ['Jalalabad Cantonment', 'Tukerbazar', 'Kajolshah', 'Moglabazar', 'Kathaltali']
            },
            'South Surma': {
              unions: ['Alampur', 'Mogla Bazar', 'Ramnagar', 'Sonargaon', 'Daudpur', 'Lalbazar']
            },
            'Companiganj': {
              unions: ['Companiganj', 'Islampur Purba', 'Islampur Paschim', 'Telikhal', 'Raniganj']
            },
            'Golapganj': {
              unions: ['Golapganj', 'Lakshmipur', 'Dhakadakshin', 'Fulbari', 'Budhbaribazar']
            },
            'Balaganj': {
              unions: ['Balaganj', 'Biswanath', 'Dakshin Banigram', 'Dayamir', 'Goala Bazar']
            },
            'Beanibazar': {
              unions: ['Beanibazar', 'Dubag', 'Kurerpar', 'Maulatali', 'Shirampur']
            },
            'Bishwanath': {
              unions: ['Bishwanath', 'Alankari', 'Dashghar', 'Lama Kazi', 'Rampasha']
            },
            'Fenchuganj': {
              unions: ['Fenchuganj', 'Chiknagul', 'Gilachipa', 'Maijgaon', 'Raniganj']
            },
            'Gowainghat': {
              unions: ['Gowainghat', 'Alirgaon', 'Fatehpur', 'Lengura', 'Rustampur']
            },
            'Jaintiapur': {
              unions: ['Jaintiapur', 'Charikata', 'Chiknagul', 'Dorbost', 'Nijpat']
            },
            'Kanaighat': {
              unions: ['Kanaighat', 'Bara Chatul', 'Dakshin Banigram', 'Jaflong', 'Lamba']
            },
            'Zakiganj': {
              unions: ['Zakiganj', 'Barahal', 'Barathakuri', 'Kajolshah', 'Manikpur']
            }
          }
        },
        'Moulvibazar': {
          upazilas: {
            'Moulvibazar Sadar': {
              unions: ['Moulvibazar Pourashava', 'Khalilpur', 'Manumukh', 'Mostafapur', 'Uttarbhag']
            },
            'Sreemangal': {
              unions: ['Sreemangal', 'Kalighat', 'Rajghat', 'Sindurkhan', 'Ashidron', 'Bhunabir']
            },
            'Kulaura': {
              unions: ['Kulaura', 'Baramchol', 'Routhgaon', 'Sharifpur', 'Barlekha', 'Joychandi']
            },
            'Rajnagar': {
              unions: ['Rajnagar', 'Mansurnagar', 'Kamalpur', 'Tengra', 'Panchgaon']
            },
            'Kamalganj': {
              unions: ['Kamalganj', 'Adampur', 'Munshibazar', 'Patrakhola', 'Rahmantola']
            },
            'Barlekha': {
              unions: ['Barlekha', 'Dakshin Shahbajpur', 'Juri', 'Talimpur', 'Uttar Shahbazpur']
            },
            'Juri': {
              unions: ['Juri', 'Fotepur', 'Goalbari', 'Jagatpur', 'Sagarnal']
            }
          }
        },
        'Habiganj': {
          upazilas: {
            'Habiganj Sadar': {
              unions: ['Habiganj Pourashava', 'Nurpur', 'Shayestaganj', 'Dewanbazar', 'Gopaya', 'Laskerpur']
            },
            'Nabiganj': {
              unions: ['Nabiganj', 'Bausha', 'Debpara', 'Paniumra', 'Dighalbank', 'Itakhola']
            },
            'Chunarughat': {
              unions: ['Chunarughat', 'Gaziumra', 'Mirpur', 'Ranigaon', 'Satkapon']
            },
            'Bahubal': {
              unions: ['Bahubal', 'Bhadeshwar', 'Jagadishpur', 'Lamatashi', 'Makrampur']
            },
            'Ajmiriganj': {
              unions: ['Ajmiriganj', 'Badolpur', 'Jolsuka', 'Joydurbar', 'Nijampur']
            },
            'Baniyachang': {
              unions: ['Baniyachang', 'Baragram', 'Daulatpur', 'Khagaura', 'Makrampur']
            },
            'Lakhai': {
              unions: ['Lakhai', 'Bamoi', 'Bulla', 'Itakhola', 'Kagaura', 'Kharmai']
            },
            'Madhabpur': {
              unions: ['Madhabpur', 'Chitoshpur', 'Jalalpur', 'Lamatashi', 'Shahjahanpur']
            }
          }
        },
        'Sunamganj': {
          upazilas: {
            'Sunamganj Sadar': {
              unions: ['Sunamganj Pourashava', 'Laxmipur', 'Kathair', 'Mollapur', 'Patharia', 'Raniganj']
            },
            'Chhatak': {
              unions: ['Chhatak', 'Khurma', 'Singchapair', 'Noarai', 'Chaila Afjalpur', 'Gobindganj']
            },
            'Jagannathpur': {
              unions: ['Jagannathpur', 'Mirpur', 'Asimganj', 'Rajanagar', 'Patharia', 'Syedpur Shaharpara']
            },
            'Derai': {
              unions: ['Derai', 'Charnarchar', 'Kulanj', 'Rafinagar', 'Taral']
            },
            'Dharamapasha': {
              unions: ['Dharamapasha', 'Bongshikunda', 'Dharmapasha Dakshin', 'Paikurati', 'Selborash']
            },
            'Bishwambarpur': {
              unions: ['Bishwambarpur', 'Bengdoba', 'Fatepur', 'Palash', 'Solukabad']
            },
            'Tahirpur': {
              unions: ['Tahirpur', 'Balijuri', 'Barkhal', 'Dakshin Badaghat', 'Dharmapasha']
            },
            'Dowarabazar': {
              unions: ['Dowarabazar', 'Banglabajar', 'Boglakachna', 'Dakshin Sukhair', 'Pandargaon']
            },
            'Shalla': {
              unions: ['Shalla', 'Atgaon', 'Habibpur', 'Kursha', 'Patli']
            },
            'Sulla': {
              unions: ['Sulla', 'Atharobari', 'Bahara', 'Dargapasha', 'Habibur Nagor']
            },
            'Jamalganj': {
              unions: ['Jamalganj', 'Beheli', 'Fenerbak', 'Sachna Bazar', 'Satgaon']
            }
          }
        }
      }
    },
    'Barisal': {
      districts: {
        'Barisal': {
          upazilas: {
            'Barisal Sadar': {
              unions: ['Barisal City', 'Kashipur', 'Chandpura', 'Charmonai', 'Charamad', 'Karapur']
            },
            'Bakerganj': {
              unions: ['Bakerganj', 'Durgapasha', 'Nilambar', 'Gaila', 'Kakorabunia', 'Rahamtpur']
            },
            'Babuganj': {
              unions: ['Babuganj', 'Dehergati', 'Chandpasha', 'Rupatali', 'Kaderpur', 'Madhabpasha']
            },
            'Wazirpur': {
              unions: ['Wazirpur', 'Dhanisafa', 'Shyalkupa', 'Guabaria', 'Safipur']
            },
            'Banaripara': {
              unions: ['Banaripara', 'Chakhar', 'Illuhar', 'Ratnapur', 'Salimabad', 'Udykhati']
            },
            'Gournadi': {
              unions: ['Gournadi', 'Batajore', 'Chandshi', 'Khandapasha', 'Nathullabad']
            },
            'Agailjhara': {
              unions: ['Agailjhara', 'Bagdha', 'Gachua', 'Patarhat', 'Ratnapur']
            },
            'Mehendiganj': {
              unions: ['Mehendiganj', 'Alimabad', 'Barakhota', 'Chandshi', 'Jangalia']
            },
            'Muladi': {
              unions: ['Muladi', 'Charakkotha', 'Hazarigonj', 'Kazirhut', 'Nazirpur']
            },
            'Hizla': {
              unions: ['Hizla', 'Dhulkhola', 'Harinathpur', 'Memania', 'Razapur']
            }
          }
        },
        'Patuakhali': {
          upazilas: {
            'Patuakhali Sadar': {
              unions: ['Patuakhali Pourashava', 'Auliapur', 'Laukathi', 'Marichbunia', 'Jangalia', 'Khepupara']
            },
            'Kalapara': {
              unions: ['Kalapara', 'Nilganj', 'Dhankhali', 'Mohipur', 'Baliatali', 'Chila Tali']
            },
            'Dashmina': {
              unions: ['Dashmina', 'Gauramva', 'Mahipur', 'Pangasia', 'Sreerampur']
            },
            'Dumki': {
              unions: ['Dumki', 'Angaria', 'Durgapur', 'Muradia', 'Pangasia', 'Sarenga']
            },
            'Galachipa': {
              unions: ['Galachipa', 'Amkhola', 'Charkajol', 'Gazalia', 'Golkhali', 'Panikora']
            },
            'Bauphal': {
              unions: ['Bauphal', 'Aylakarar Char', 'Boga', 'Daspara', 'Kalaiya', 'Najirpur']
            },
            'Rangabali': {
              unions: ['Rangabali', 'Bara Baishdia', 'Chalitabunia', 'Chattola', 'Maulavir Char']
            },
            'Mirza Ganj': {
              unions: ['Mirza Ganj', 'Amragachiya', 'Deuli Subidkhali', 'Kamalapur', 'Miriamkati']
            }
          }
        },
        'Bhola': {
          upazilas: {
            'Bhola Sadar': {
              unions: ['Bhola Pourashava', 'Alipur', 'Bapta', 'Dhania', 'Kachia', 'Rajapur']
            },
            'Borhanuddin': {
              unions: ['Borhanuddin', 'Bara Manika', 'Dakshin Sakuchia', 'Deula', 'Kachi Katha']
            },
            'Charfasson': {
              unions: ['Charfasson', 'Char Khalipa', 'Char Madraj', 'Char Pataiya', 'Madhya Char']
            },
            'Daulatkhan': {
              unions: ['Daulatkhan', 'Chandpur', 'Char Abdulla', 'Hajipur', 'Kajer Char']
            },
            'Lalmohan': {
              unions: ['Lalmohan', 'Char Kalakopa', 'Farajganj', 'Hazipur', 'Lord Harding']
            },
            'Manpura': {
              unions: ['Manpura', 'Char Kaliganj', 'Hazir Hat', 'Sakuchia']
            },
            'Tazumuddin': {
              unions: ['Tazumuddin', 'Bara Manika', 'Char Bhuta', 'Lalua', 'Sonapur']
            }
          }
        },
        'Jhalokati': {
          upazilas: {
            'Jhalokati Sadar': {
              unions: ['Jhalokati Pourashava', 'Basanda', 'Gabua', 'Keora', 'Nabagram', 'Shekherhat']
            },
            'Kathalia': {
              unions: ['Kathalia', 'Amua', 'Gabkhan', 'Sholla', 'Shekerhat']
            },
            'Nalchity': {
              unions: ['Nalchity', 'Bajitpur', 'Dapdapia', 'Kalibari', 'Sahatali']
            },
            'Rajapur': {
              unions: ['Rajapur', 'Baradashi', 'Kalma', 'Nabagram', 'Salikati']
            }
          }
        },
        'Pirojpur': {
          upazilas: {
            'Pirojpur Sadar': {
              unions: ['Pirojpur Pourashava', 'Amrazuri', 'Durgapur', 'Kadamtola', 'Sapleza', 'Tona']
            },
            'Nazirpur': {
              unions: ['Nazirpur', 'Shakharikati', 'Dhanisafa', 'Mathurapur', 'Sohagdal']
            },
            'Nesarabad': {
              unions: ['Nesarabad', 'Andharmanik', 'Ahammedpur', 'Deuli', 'Guarekha']
            },
            'Bhandaria': {
              unions: ['Bhandaria', 'Bamra', 'Dhawa', 'Ikri', 'Malsur', 'Tiabunia']
            },
            'Kawkhali': {
              unions: ['Kawkhali', 'Chitalmari', 'Kakchira', 'Mandra', 'Sapleza']
            },
            'Mathbaria': {
              unions: ['Mathbaria', 'Betmor Hat', 'Deuli', 'Holabunia', 'Mirzaganj']
            },
            'Indurkani': {
              unions: ['Indurkani', 'Amrajuri', 'Dhanisafa', 'Madarbunia', 'Sayna']
            }
          }
        },
        'Barguna': {
          upazilas: {
            'Barguna Sadar': {
              unions: ['Barguna Pourashava', 'Ayla Patakata', 'Burir Char', 'Kanak Dia', 'M. Baliatali']
            },
            'Amtali': {
              unions: ['Amtali', 'Arpangashia', 'Athara Gashia', 'Chowra', 'Gulishakhali', 'Haldia']
            },
            'Betagi': {
              unions: ['Betagi', 'Bibichini', 'Bukabunia', 'Hosnabad', 'Kazirabad', 'Mokamia']
            },
            'Bamna': {
              unions: ['Bamna', 'Bukabunia', 'Doutola', 'Ramna', 'Torobakiya']
            },
            'Patharghata': {
              unions: ['Patharghata', 'Amtali', 'Char Duanti', 'Kalmegha', 'Raihanpur']
            },
            'Taltali': {
              unions: ['Taltali', 'Badarkhali', 'Chhotadumuria', 'Sonakata', 'Tachhana']
            }
          }
        }
      }
    },
    'Rangpur': {
      districts: {
        'Rangpur': {
          upazilas: {
            'Rangpur Sadar': {
              unions: ['Rangpur City', 'Tajhat', 'Alamnagar', 'Tampat']
            },
            'Gangachara': {
              unions: ['Gangachara', 'Kolkonda', 'Lakshmipur', 'Mominpur']
            },
            'Kaunia': {
              unions: ['Kaunia', 'Haragachh', 'Kursha', 'Santoshpur']
            },
            'Badarganj': {
              unions: ['Badarganj', 'Damodorpur', 'Gopinathpur', 'Radhanagar']
            }
          }
        },
        'Dinajpur': {
          upazilas: {
            'Dinajpur Sadar': {
              unions: ['Dinajpur Pourashava', 'Chehelgazi', 'Fazilpur', 'Auliapur']
            },
            'Birampur': {
              unions: ['Birampur', 'Khaprabhita', 'Palashbari', 'Mongalpur']
            },
            'Parbatipur': {
              unions: ['Parbatipur', 'Dhamor', 'Habra', 'Hossainpur']
            },
            'Khansama': {
              unions: ['Khansama', 'Bhabanipur', 'Gopalpur', 'Purana Pail']
            }
          }
        },
        'Kurigram': {
          upazilas: {
            'Kurigram Sadar': {
              unions: ['Kurigram Pourashava', 'Bhogdanga', 'Belgachha', 'Jatrapur']
            },
            'Ulipur': {
              unions: ['Ulipur', 'Bazra', 'Daldalia', 'Panchpukur']
            },
            'Nageshwari': {
              unions: ['Nageshwari', 'Bhurungamari', 'Bangasonahat', 'Kanthalbari']
            }
          }
        },
        'Nilphamari': {
          upazilas: {
            'Nilphamari Sadar': {
              unions: ['Nilphamari Pourashava', 'Nitai', 'Gorgram', 'Khata Madhupur']
            },
            'Saidpur': {
              unions: ['Saidpur Pourashava', 'Alampur', 'Botlagari', 'Saidpur Cantt']
            },
            'Jaldhaka': {
              unions: ['Jaldhaka', 'Kathali', 'Shimulbari', 'Saldanga']
            }
          }
        }
      }
    },
    'Mymensingh': {
      districts: {
        'Mymensingh': {
          upazilas: {
            'Mymensingh Sadar': {
              unions: ['Mymensingh City', 'Akua', 'Bhaluka', 'Char Nilaxia']
            },
            'Muktagachha': {
              unions: ['Muktagachha', 'Basak', 'Habirbari', 'Raghunathpur']
            },
            'Trishal': {
              unions: ['Trishal', 'Balipara', 'Dhala', 'Kanihari']
            },
            'Gafargaon': {
              unions: ['Gafargaon', 'Dhanshail', 'Panchbag', 'Tangabo']
            }
          }
        },
        'Jamalpur': {
          upazilas: {
            'Jamalpur Sadar': {
              unions: ['Jamalpur Pourashava', 'Narundi', 'Titpalla', 'Sharifpur']
            },
            'Sarishabari': {
              unions: ['Sarishabari', 'Bhatara', 'Pingna', 'Shamganj']
            },
            'Madarganj': {
              unions: ['Madarganj', 'Adra', 'Chinaduli', 'Narail']
            },
            'Dewanganj': {
              unions: ['Dewanganj', 'Balijuri', 'Chikajani', 'Hatibandha']
            }
          }
        },
        'Netrokona': {
          upazilas: {
            'Netrokona Sadar': {
              unions: ['Netrokona Pourashava', 'Chandigarh', 'Kailati', 'Krishnapur']
            },
            'Durgapur': {
              unions: ['Durgapur', 'Birisiri', 'Gawkandia', 'Kullagura']
            },
            'Purbadhala': {
              unions: ['Purbadhala', 'Kharnoi', 'Madan', 'Gazipur']
            }
          }
        },
        'Sherpur': {
          upazilas: {
            'Sherpur Sadar': {
              unions: ['Sherpur Pourashava', 'Betmari Ghughurakandi', 'Pakuria', 'Sreebordi']
            },
            'Nalitabari': {
              unions: ['Nalitabari', 'Balijhuri', 'Kolkonda', 'Rupnarayanpur']
            },
            'Jhenaigati': {
              unions: ['Jhenaigati', 'Gazipur', 'Hatibandha', 'Nalkura']
            }
          }
        }
      }
    }
  }
};

// Helper function to get all divisions
export const getDivisions = (): string[] => {
  return Object.keys(bangladeshLocations.divisions);
};

// Helper function to get districts by division
export const getDistricts = (division: string): string[] => {
  const div = bangladeshLocations.divisions[division];
  return div ? Object.keys(div.districts) : [];
};

// Helper function to get upazilas by district
export const getUpazilas = (division: string, district: string): string[] => {
  const div = bangladeshLocations.divisions[division];
  if (!div) return [];
  const dist = div.districts[district];
  return dist ? Object.keys(dist.upazilas) : [];
};

// Helper function to get unions by upazila
export const getUnions = (division: string, district: string, upazila: string): string[] => {
  const div = bangladeshLocations.divisions[division];
  if (!div) return [];
  const dist = div.districts[district];
  if (!dist) return [];
  const upa = dist.upazilas[upazila];
  return upa ? upa.unions : [];
};
