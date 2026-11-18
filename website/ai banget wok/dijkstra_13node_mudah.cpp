/**
 * ============================================================================
 * PROGRAM C++ MUDAH DIPAHAMI: DIJKSTRA STANDARD O(V^2) VS MIN-HEAP O((V+E)logV)
 * ============================================================================
 * Topologi : 13 Node (Node 1 s/d Node 13) dan 24 Jalur (Metode OSPF Cost)
 * Rumus    : OSPF Cost = Reference Bandwidth (100 Mbps) / Bandwidth Jalur
 *
 * Cara Menjalankan di Terminal / VS Code:
 *   g++ dijkstra_13node_mudah.cpp -o dijkstra_mudah
 *   ./dijkstra_mudah
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <queue>
#include <algorithm>

using namespace std;

const int JUMLAH_NODE = 13;
const int TAK_HINGGA = 999999;

// 1. Struktur sederhana untuk menyimpan informasi Jalur (Kabel antar Node)
struct Jalur {
    int dari;
    int ke;
    int bandwidthMbps;
    int cost;       // Cost OSPF = 100 / bandwidthMbps
    bool aktif;     // true = Menyala (ON), false = Putus (OFF)
};

// Struktur untuk menyimpan tetangga pada daftar ketetanggaan (Adjacency List)
struct Tetangga {
    int nodeTujuan;
    int costJalur;
};

// Daftar 24 Jalur sesuai gambar Topologi 13 Node
vector<Jalur> daftarSemuaJalur = {
    {1,  2,  10,  10, true}, // Node 1 <-> Node 2  (10 Mbps,  Cost = 10)
    {1,  4,  50,  2,  true}, // Node 1 <-> Node 4  (50 Mbps,  Cost = 2)
    {1,  7,  10,  10, true}, // Node 1 <-> Node 7  (10 Mbps,  Cost = 10)
    {2,  3,  25,  4,  true}, // Node 2 <-> Node 3  (25 Mbps,  Cost = 4)
    {2,  4,  25,  4,  true}, // Node 2 <-> Node 4  (25 Mbps,  Cost = 4)
    {2,  5,  20,  5,  true}, // Node 2 <-> Node 5  (20 Mbps,  Cost = 5)
    {3,  9,  10,  10, true}, // Node 3 <-> Node 9  (10 Mbps,  Cost = 10)
    {4,  5,  100, 1,  true}, // Node 4 <-> Node 5  (100 Mbps, Cost = 1)
    {4,  6,  20,  5,  true}, // Node 4 <-> Node 6  (20 Mbps,  Cost = 5)
    {5,  6,  25,  4,  true}, // Node 5 <-> Node 6  (25 Mbps,  Cost = 4)
    {5,  8,  50,  2,  true}, // Node 5 <-> Node 8  (50 Mbps,  Cost = 2)
    {5,  9,  20,  5,  true}, // Node 5 <-> Node 9  (20 Mbps,  Cost = 5)
    {6,  7,  50,  2,  true}, // Node 6 <-> Node 7  (50 Mbps,  Cost = 2)
    {6,  8,  50,  2,  true}, // Node 6 <-> Node 8  (50 Mbps,  Cost = 2)
    {7,  11, 25,  4,  true}, // Node 7 <-> Node 11 (25 Mbps,  Cost = 4)
    {7,  13, 10,  10, true}, // Node 7 <-> Node 13 (10 Mbps,  Cost = 10)
    {8,  9,  25,  4,  true}, // Node 8 <-> Node 9  (25 Mbps,  Cost = 4)
    {8,  11, 50,  2,  true}, // Node 8 <-> Node 11 (50 Mbps,  Cost = 2)
    {8,  12, 20,  5,  true}, // Node 8 <-> Node 12 (20 Mbps,  Cost = 5)
    {9,  10, 10,  10, true}, // Node 9 <-> Node 10 (10 Mbps,  Cost = 10)
    {10, 12, 25,  4,  true}, // Node 10 <-> Node 12 (25 Mbps, Cost = 4)
    {11, 12, 25,  4,  true}, // Node 11 <-> Node 12 (25 Mbps, Cost = 4)
    {11, 13, 25,  4,  true}, // Node 11 <-> Node 13 (25 Mbps, Cost = 4)
    {12, 13, 100, 1,  true}  // Node 12 <-> Node 13 (100 Mbps, Cost = 1)
};

// Status aktif tiap Node (indeks 1 sampai 13)
vector<bool> nodeAktif(JUMLAH_NODE + 1, true);

// Fungsi bantu untuk menyusun daftar tetangga dari jalur yang sedang aktif
vector<vector<Tetangga>> bangunDaftarTetangga() {
    vector<vector<Tetangga>> daftarTetangga(JUMLAH_NODE + 1);
    for (const Jalur &j : daftarSemuaJalur) {
        if (j.aktif && nodeAktif[j.dari] && nodeAktif[j.ke]) {
            daftarTetangga[j.dari].push_back({j.ke, j.cost});
            daftarTetangga[j.ke].push_back({j.dari, j.cost}); // Graf bolak-balik
        }
    }
    return daftarTetangga;
}

// Fungsi bantu untuk mencetak urutan rute dari node awal ke tujuan
void cetakRute(const vector<int> &sebelum, int tujuan) {
    vector<int> rute;
    for (int sekarang = tujuan; sekarang != -1; sekarang = sebelum[sekarang]) {
        rute.push_back(sekarang);
    }
    reverse(rute.begin(), rute.end());

    for (size_t i = 0; i < rute.size(); i++) {
        cout << "Node " << rute[i];
        if (i + 1 < rute.size()) cout << " -> ";
    }
    cout << endl;
}

// ============================================================================
// METODE 1: DIJKSTRA STANDARD (LINEAR ARRAY SCAN - KOMPLEKSITAS O(V^2))
// ============================================================================
void jalankanDijkstraStandard(int awal, int tujuan) {
    vector<vector<Tetangga>> daftarTetangga = bangunDaftarTetangga();
    vector<int> jarak(JUMLAH_NODE + 1, TAK_HINGGA);
    vector<int> sebelum(JUMLAH_NODE + 1, -1);
    vector<bool> dikunjungi(JUMLAH_NODE + 1, false);

    int operasiScanArray = 0;
    int operasiCekTetangga = 0;

    jarak[awal] = 0;

    // Ulangi sebanyak jumlah node (13 kali)
    for (int langkah = 1; langkah <= JUMLAH_NODE; langkah++) {
        // CARA STANDARD: Cek satu per satu dari Node 1 sampai Node 13
        // untuk mencari node yang belum dikunjungi dengan jarak paling kecil
        int u = -1;
        int jarakTerkecil = TAK_HINGGA;

        for (int i = 1; i <= JUMLAH_NODE; i++) {
            operasiScanArray++; // Dihitung 1 operasi cek array
            if (!dikunjungi[i] && nodeAktif[i] && jarak[i] < jarakTerkecil) {
                jarakTerkecil = jarak[i];
                u = i;
            }
        }

        // Jika tidak ada lagi node yang bisa dijangkau, hentikan pencarian
        if (u == -1 || jarakTerkecil == TAK_HINGGA) break;

        dikunjungi[u] = true; // Kunci Node u

        // Periksa semua tetangga yang terhubung dengan Node u
        for (const Tetangga &t : daftarTetangga[u]) {
            int v = t.nodeTujuan;
            int costJalur = t.costJalur;

            if (!dikunjungi[v] && nodeAktif[v]) {
                operasiCekTetangga++;
                // Jika lewat Node u jaraknya lebih pendek, perbarui jarak[v]
                if (jarak[u] + costJalur < jarak[v]) {
                    jarak[v] = jarak[u] + costJalur;
                    sebelum[v] = u;
                    operasiCekTetangga++;
                }
            }
        }
    }

    cout << endl;
    cout << "============================================================" << endl;
    cout << " 1. HASIL DIJKSTRA STANDARD (ARRAY SCAN - O(V^2))" << endl;
    cout << "============================================================" << endl;
    cout << "Rute Terpendek : ";
    cetakRute(sebelum, tujuan);
    cout << "Total Cost OSPF: " << jarak[tujuan] << endl;
    cout << "Total Operasi  : " << (operasiScanArray + operasiCekTetangga)
         << " operasi (" << operasiScanArray << " scan array + "
         << operasiCekTetangga << " cek/update tetangga)" << endl;
}

// ============================================================================
// METODE 2: DIJKSTRA MIN-HEAP (PRIORITY QUEUE - KOMPLEKSITAS O((V+E) log V))
// ============================================================================
// Struktur data untuk item di dalam Min-Heap agar mudah dibaca
struct ItemHeap {
    int costSaatIni;
    int idNode;

    // Aturan agar Min-Heap selalu menaruh Cost TERKECIL di posisi paling atas (Root)
    bool operator>(const ItemHeap &lain) const {
        if (costSaatIni != lain.costSaatIni) {
            return costSaatIni > lain.costSaatIni;
        }
        return idNode > lain.idNode;
    }
};

void jalankanDijkstraMinHeap(int awal, int tujuan) {
    vector<vector<Tetangga>> daftarTetangga = bangunDaftarTetangga();
    vector<int> jarak(JUMLAH_NODE + 1, TAK_HINGGA);
    vector<int> sebelum(JUMLAH_NODE + 1, -1);
    vector<bool> dikunjungi(JUMLAH_NODE + 1, false);

    int operasiHeap = 0;
    int operasiCekTetangga = 0;

    // Deklarasi Min-Heap menggunakan priority_queue bawaan C++
    priority_queue<ItemHeap, vector<ItemHeap>, greater<ItemHeap>> antreanHeap;

    // Masukkan node awal dengan cost = 0 ke dalam Min-Heap
    jarak[awal] = 0;
    antreanHeap.push({0, awal});
    operasiHeap++;

    while (!antreanHeap.empty()) {
        // CARA MIN-HEAP: Langsung ambil elemen paling atas (Root = Cost terkecil)
        // Tidak perlu mengecek array 1..13 satu per satu!
        ItemHeap palingAtas = antreanHeap.top();
        antreanHeap.pop();
        operasiHeap += 2;

        int u = palingAtas.idNode;

        // Jika node u sudah pernah dikunci sebelumnya, langsung lewati
        if (dikunjungi[u]) continue;
        dikunjungi[u] = true; // Kunci Node u

        // Periksa semua tetangga yang terhubung dengan Node u
        for (const Tetangga &t : daftarTetangga[u]) {
            int v = t.nodeTujuan;
            int costJalur = t.costJalur;

            if (!dikunjungi[v] && nodeAktif[v]) {
                operasiCekTetangga++;
                // Jika ditemukan jalur yang lebih pendek, update jarak & masukkan ke Min-Heap
                if (jarak[u] + costJalur < jarak[v]) {
                    jarak[v] = jarak[u] + costJalur;
                    sebelum[v] = u;
                    antreanHeap.push({jarak[v], v});
                    operasiHeap += 2;
                    operasiCekTetangga++;
                }
            }
        }
    }

    cout << endl;
    cout << "============================================================" << endl;
    cout << " 2. HASIL DIJKSTRA MIN-HEAP (PRIORITY QUEUE - O((V+E)logV))" << endl;
    cout << "============================================================" << endl;
    cout << "Rute Terpendek : ";
    cetakRute(sebelum, tujuan);
    cout << "Total Cost OSPF: " << jarak[tujuan] << endl;
    cout << "Total Operasi  : " << (operasiHeap + operasiCekTetangga)
         << " operasi (" << operasiHeap << " operasi Heap + "
         << operasiCekTetangga << " cek/update tetangga)" << endl;
}

int main() {
    int nodeAwal = 1;
    int nodeTujuan = 13;

    cout << "SIMULASI PERBANDINGAN DIJKSTRA STANDARD VS DIJKSTRA MIN-HEAP" << endl;
    cout << "Topologi: 13 Node (1 - 13) & 24 Jalur OSPF" << endl;

    // Jalankan kedua metode untuk membandingkan hasilnya
    jalankanDijkstraStandard(nodeAwal, nodeTujuan);
    jalankanDijkstraMinHeap(nodeAwal, nodeTujuan);

    return 0;
}
