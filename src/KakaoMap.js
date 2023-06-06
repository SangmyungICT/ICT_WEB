/* global kakao */
import axios from 'axios';
import { useEffect, useState } from 'react';
import { Map, MapMarker, ZoomControl } from 'react-kakao-maps-sdk';

const KakaoMap = () => {
  //서버에서 가져올 쓰레기통들
  const [trashbinsArr, setTrashbinsArr] = useState([
    {
      trashBinId: 13,
      trashCategory: 'GENERAL',
      address: {
        gu: '종로구',
        roadName: '율곡로',
        detailAddress: '삼청로1 맞은편 인도',
        installPoint: '광장, 공원 등 다중집합장소',
        latitude: 37.5760608,
        longitude: 126.9778939,
      },
    },
  ]);
  //현재 위치 좌표
  const [position, setPosition] = useState({
    center: {
      lat: 37.569851,
      lng: 127.023321,
    },
  });

  // RN에서 좌표 가져오기
  // 모바일웹의 웹뷰로 하려고 했는데 동작 안해서 일단 보류
  // useEffect(() => {
  //   window.addEventListener('message', (e) => {
  //     if (
  //       e.data.type === 'webpackOk' ||
  //       String(e.data.type).includes('webpack')
  //     )
  //       return;
  //     const parsedMessage = JSON.parse(e.data);
  //     if (parsedMessage.type === 'position') {
  //       setPosition({
  //         center: {
  //           lat: parsedMessage.data.coords.latitude,
  //           lng: parsedMessage.data.coords.longitude,
  //         },
  //       });
  //     }
  //   });
  // }, []);

  // 현재 위치 좌표 가져오기
  const setCurrentPosition = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setPosition({
        center: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      });
    });
  };

  useEffect(() => {
    setCurrentPosition();
  }, []);

  //위도, 경도, 거리를 통해 주변 쓰레기통 가져오기 함수
  const getNearBins = async (latitude, longitude, distance = 500) => {
    await axios
      .get('https://ssketch.kro.kr/trashbin/getnearbins', {
        params: {
          distance,
          latitude,
          longitude,
        },
      })
      .then((response) => {
        if (response.status === 200 && response.data) {
          setTrashbinsArr(response.data);
        }
      })
      .catch((error) => console.log(error));
  };

  // 최초 렌더링시, position(현재 지도상의 center 좌표)가 변경될 때마다 주변 쓰레기통 가져오기 함수 호출
  useEffect(() => {
    getNearBins(position.center.lat, position.center.lng, 500);
  }, [position]);

  // 쓰레기통 생성 함수
  const createTrashbin = (lat, lng) => {
    // 클릭한 지점 위치 정보 가져오기
    let geocoder = new kakao.maps.services.Geocoder();
    let coord = new kakao.maps.LatLng(lat, lng);
    let callback = async function (result, status) {
      if (status === kakao.maps.services.Status.OK) {
        const addressInfo = result;
        const reportData = {
          address_name: addressInfo.address_name
            ? addressInfo.address_name
            : '주소 정보가 없음',
          building_name: addressInfo.building_name
            ? addressInfo.building_name
            : '빌딩 정보가 없음',
          latitude: lat,
          longitude: lng,
          main_building_no: addressInfo.main_building_no
            ? addressInfo.main_building_no
            : '메인 빌딩 정보가 없음',
          nullCount: 0,
          region_1depth_name: addressInfo.region_1depth_name
            ? addressInfo.region_1depth_name
            : '1depth 정보가 없음',
          region_2depth_name: addressInfo.region_2depth_name
            ? addressInfo.region_2depth_name
            : '2depth 정보가 없음',
          region_3depth_name: addressInfo.region_3depth_name
            ? addressInfo.region_3depth_name
            : '3depth 정보가 없음',
          road_name: addressInfo.road_name
            ? addressInfo.road_name
            : '도로 이름 정보가 없음',
          trashCategory: 'userMade',
        };
        // 위치정보를 서버로 전달해서 쓰레기통 생성
        await axios
          .post('https://ssketch.kro.kr/report/create', reportData)
          .then((_res) =>
            getNearBins(position.center.lat, position.center.lng, 500)
          )
          .catch((error) => console.log(error));
      }
    };
    geocoder.coord2Address(coord.getLng(), coord.getLat(), callback);
  };

  const deleteTrashbin = async (trashbin) => {
    // trashBinId 추출
    const { trashBinId } = trashbin;
    await axios
      .delete('https://ssketch.kro.kr/trashbin/delete', {
        params: {
          trashBinId: Number(trashBinId),
        },
      })
      .then((_res) =>
        getNearBins(position.center.lat, position.center.lng, 500)
      )
      .catch((error) => console.log(error));
  };

  //Map에서 클릭한 좌표
  const [clickedPosition, setClickedPosition] = useState();
  //클릭한 마커
  const [clickedMarker, setClickedMarker] = useState();
  // 마커 보여지게 할지 말지 state?
  const [buttonVisible, setButtonVisible] = useState(false);
  // 마우스가 올라간 지점
  const [mouseOver, setMouseOver] = useState();

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            backgroundColor: '#0f0',
            width: '100%',
            opacity: '0.7',
            minHeight: '20px',
            textAlign: 'center',
            lineHeight: '100%',
          }}
        >
          <p
            style={{
              color: 'white',
              fontSize: '28px',
              fontWeight: 'bold',
            }}
          >
            SSCETCH
          </p>
        </div>
        {position.center && (
          <Map
            center={position.center}
            style={{ width: '100vw', height: '80vh', padding: '12px' }}
            level={4}
            onClick={(t, mouseEvent) => {
              setClickedPosition({
                lat: mouseEvent.latLng.getLat(),
                lng: mouseEvent.latLng.getLng(),
              });
            }}
            onDragEnd={(map) => {
              setPosition({
                center: {
                  lat: map.getCenter().getLat(),
                  lng: map.getCenter().getLng(),
                },
              });
            }}
          >
            <ZoomControl position={kakao.maps.ControlPosition.TOPRIGHT} />
            {clickedPosition && (
              <MapMarker position={clickedPosition}>
                <button
                  style={{
                    border: 0,
                    borderRadius: '20x',
                    backgroundColor: 'white ',
                    color: 'red',
                    opacity: '0.7',
                    fontWeight: 'bold',
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    createTrashbin(clickedPosition.lat, clickedPosition.lng)
                  }
                >
                  여기에 쓰레기통 추가
                </button>
              </MapMarker>
            )}
            {trashbinsArr.map((trashbin, idx) => {
              return (
                <MapMarker
                  key={trashbin.trashBinId}
                  position={{
                    lat: trashbin.address.latitude,
                    lng: trashbin.address.longitude,
                  }}
                  clickable={true}
                  onClick={() => {
                    setClickedMarker(idx);
                    if (buttonVisible && clickedMarker === idx) {
                      setButtonVisible(false);
                      setClickedMarker(null);
                    } else {
                      setButtonVisible(true);
                    }
                  }}
                  onMouseOver={() => setMouseOver(idx)}
                  onMouseOut={() => setMouseOver(null)}
                  opacity={idx === mouseOver || idx === clickedMarker ? 1 : 0.7}
                >
                  {buttonVisible && clickedMarker === idx && (
                    <button
                      style={{
                        border: 0,
                        borderRadius: '20x',
                        backgroundColor: 'white ',
                        color: 'red',
                        opacity: '0.7',
                        fontWeight: 'bold',
                        width: '100%',
                        height: '100%',
                        cursor: 'pointer',
                      }}
                      onClick={() => deleteTrashbin(trashbin)}
                    >
                      여기 쓰레기통 삭제
                    </button>
                  )}
                </MapMarker>
              );
            })}
          </Map>
        )}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* <button
            style={{
              // width: '60vh',
              height: '8vh',
              margin: '20px',
              fontSize: '18px',
              fontWeight: 'bold',
              borderRadius: '20px',
              border: '2px solid #0f0',
              backgroundColor: 'white',
              cursor: 'pointer',
              zIndex: 999,
            }}
            onClick={setCurrentPosition}
          >
            현재 위치로 이동하기
          </button> */}
        </div>
      </div>
    </>
  );
};
export default KakaoMap;
