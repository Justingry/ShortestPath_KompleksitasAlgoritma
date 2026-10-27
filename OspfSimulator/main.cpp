#include "MainWindow.h"
#include <QApplication>
#include <QStyleFactory>

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    a.setStyle(QStyleFactory::create("Fusion"));
    
    MainWindow w;
    w.setWindowTitle("Simulasi Shortest Path Topologi Jaringan OSPF - Dijkstra");
    w.resize(1200, 800);
    w.show();
    
    return a.exec();
}